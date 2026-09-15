package com.sentinelx.auth;

import com.sentinelx.auth.dto.LoginRequest;
import com.sentinelx.auth.dto.RegisterRequest;
import com.sentinelx.auth.entity.RoleEntity;
import com.sentinelx.auth.entity.UserEntity;
import com.sentinelx.auth.repository.RefreshTokenRepository;
import com.sentinelx.auth.repository.RoleRepository;
import com.sentinelx.auth.repository.UserRepository;
import com.sentinelx.auth.security.JwtTokenProvider;
import com.sentinelx.auth.security.PasswordEncodingService;
import com.sentinelx.auth.service.AuthService;
import com.sentinelx.auth.service.LoginAttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private LoginAttemptService loginAttemptService;

    private PasswordEncodingService passwordEncodingService;
    private JwtTokenProvider jwtTokenProvider;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncodingService = new PasswordEncodingService();
        jwtTokenProvider = new JwtTokenProvider(
                "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970",
                900000,
                604800000
        );
        authService = new AuthService(
                userRepository,
                roleRepository,
                refreshTokenRepository,
                passwordEncodingService,
                jwtTokenProvider,
                loginAttemptService
        );
    }

    @Test
    void testPasswordEncodingAndVerification() {
        String raw = "StrongPassword@123";
        String encoded = passwordEncodingService.encode(raw);
        assertNotNull(encoded);
        assertTrue(passwordEncodingService.matches(raw, encoded));
        assertFalse(passwordEncodingService.matches("WrongPassword", encoded));
    }

    @Test
    void testJwtTokenGenerationAndValidation() {
        String token = jwtTokenProvider.generateAccessToken("user-1", "john_doe", "ROLE_RESPONDER", java.util.List.of("INCIDENT_ACK"));
        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals("user-1", jwtTokenProvider.getUserIdFromToken(token));
    }

    @Test
    void testLoginWithLockedAccountThrowsException() {
        when(loginAttemptService.isLocked("locked_user")).thenReturn(true);

        LoginRequest request = new LoginRequest("locked_user", "password");
        assertThrows(LockedException.class, () -> authService.login(request));
    }

    @Test
    void testLoginWithInvalidPasswordThrowsBadCredentials() {
        when(loginAttemptService.isLocked("valid_user")).thenReturn(false);

        RoleEntity role = new RoleEntity("ROLE_USER", "USER", "User");
        String encodedPass = passwordEncodingService.encode("CorrectPassword");
        UserEntity user = new UserEntity("valid_user", "user@sentinelx.local", encodedPass, "John", "Doe", "+123", role);

        when(userRepository.findByUsername("valid_user")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest("valid_user", "WrongPassword");
        assertThrows(BadCredentialsException.class, () -> authService.login(request));
        verify(loginAttemptService).loginFailed("valid_user");
    }

    @Test
    void testRegisterDuplicateUsernameThrowsException() {
        when(userRepository.existsByUsername("existing_user")).thenReturn(true);

        RegisterRequest request = new RegisterRequest(
                "existing_user",
                "new@sentinelx.local",
                "Password123!",
                "First",
                "Last",
                null,
                "USER"
        );

        assertThrows(IllegalArgumentException.class, () -> authService.register(request));
    }
}
