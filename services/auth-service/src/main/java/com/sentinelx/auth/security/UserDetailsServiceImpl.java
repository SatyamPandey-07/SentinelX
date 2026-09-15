package com.sentinelx.auth.security;

import com.sentinelx.auth.entity.UserEntity;
import com.sentinelx.auth.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        UserEntity user = userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + usernameOrEmail));

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        if (user.getRole() != null) {
            authorities.add(new SimpleGrantedAuthority(user.getRole().getId()));
            if (user.getRole().getPermissions() != null) {
                user.getRole().getPermissions().forEach(permission ->
                        authorities.add(new SimpleGrantedAuthority(permission.getName())));
            }
        }

        return new User(
                user.getUsername(),
                user.getPasswordHash(),
                user.isEnabled(),
                true,
                true,
                !user.isAccountLocked(),
                authorities
        );
    }
}
