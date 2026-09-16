package com.sentinelx.auth.service;

import com.sentinelx.auth.dto.*;
import com.sentinelx.auth.entity.RefreshTokenEntity;
import com.sentinelx.auth.entity.RoleEntity;
import com.sentinelx.auth.entity.UserEntity;
import com.sentinelx.auth.repository.RefreshTokenRepository;
import com.sentinelx.auth.repository.RoleRepository;
import com.sentinelx.auth.repository.UserRepository;
import com.sentinelx.auth.security.JwtTokenProvider;
import com.sentinelx.auth.security.PasswordEncodingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncodingService passwordEncodingService;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginAttemptService loginAttemptService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncodingService passwordEncodingService,
            JwtTokenProvider jwtTokenProvider,
            LoginAttemptService loginAttemptService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncodingService = passwordEncodingService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.loginAttemptService = loginAttemptService;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.username().trim();

        if (loginAttemptService.isLocked(identifier)) {
            throw new LockedException("Account is temporarily locked due to excessive failed attempts. Please try again in 15 minutes.");
        }

        UserEntity user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> {
                    loginAttemptService.loginFailed(identifier);
                    return new BadCredentialsException("Invalid username or password");
                });

        if (user.isAccountLocked()) {
            throw new LockedException("User account is administratively locked");
        }

        if (!user.isEnabled()) {
            throw new BadCredentialsException("User account is disabled");
        }

        if (!passwordEncodingService.matches(request.password(), user.getPasswordHash())) {
            loginAttemptService.loginFailed(identifier);
            throw new BadCredentialsException("Invalid username or password");
        }

        loginAttemptService.loginSucceeded(identifier);

        return generateTokenPair(user);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // Public self-registration is never trusted to self-assign a role --
        // any caller could otherwise POST {"role":"ADMIN"} and grant
        // themselves full access. Every new account starts as ROLE_USER;
        // elevation happens only via a DB-seeded account (see V3 migration)
        // or a real admin promoting someone later, never at signup time.
        RoleEntity role = roleRepository.findById("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("Default role ROLE_USER not found"));

        String encodedPassword = passwordEncodingService.encode(request.password());

        UserEntity user = new UserEntity(
                request.username().toLowerCase(),
                request.email().toLowerCase(),
                encodedPassword,
                request.firstName(),
                request.lastName(),
                request.phone(),
                role
        );

        user = userRepository.save(user);
        log.info("Registered new user: {} with role: {}", user.getUsername(), role.getName());

        return generateTokenPair(user);
    }

    @Transactional
    public AuthResponse refreshToken(TokenRefreshRequest request) {
        String rawRefreshToken = request.refreshToken();

        if (!jwtTokenProvider.validateToken(rawRefreshToken)) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        String tokenHash = hashToken(rawRefreshToken);
        RefreshTokenEntity storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadCredentialsException("Refresh token not found or already consumed"));

        if (storedToken.isRevoked() || storedToken.isExpired()) {
            throw new BadCredentialsException("Refresh token has expired or been revoked");
        }

        // Refresh Token Rotation: revoke previous token immediately
        storedToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(storedToken);

        UserEntity user = storedToken.getUser();
        if (!user.isEnabled() || user.isAccountLocked()) {
            throw new LockedException("User account is inactive or locked");
        }

        return generateTokenPair(user);
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            String tokenHash = hashToken(refreshToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.setRevokedAt(Instant.now());
                refreshTokenRepository.save(token);
            });
        }
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String username) {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        List<String> permissions = user.getRole().getPermissions().stream()
                .map(p -> p.getName())
                .toList();

        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getRole().getId(),
                permissions,
                user.isEnabled(),
                user.getCreatedAt()
        );
    }

    private AuthResponse generateTokenPair(UserEntity user) {
        List<String> permissions = user.getRole() != null && user.getRole().getPermissions() != null
                ? user.getRole().getPermissions().stream().map(p -> p.getName()).toList()
                : List.of();

        String roleName = user.getRole() != null ? user.getRole().getId() : "ROLE_USER";

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                user.getUsername(),
                roleName,
                permissions
        );

        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());
        String tokenHash = hashToken(refreshToken);

        Instant expiresAt = Instant.now().plusMillis(jwtTokenProvider.getRefreshTokenExpirationMs());
        RefreshTokenEntity refreshTokenEntity = new RefreshTokenEntity(user, tokenHash, expiresAt);
        refreshTokenRepository.save(refreshTokenEntity);

        return new AuthResponse(
                accessToken,
                refreshToken,
                jwtTokenProvider.getAccessTokenExpirationMs() / 1000,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                roleName,
                permissions
        );
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
