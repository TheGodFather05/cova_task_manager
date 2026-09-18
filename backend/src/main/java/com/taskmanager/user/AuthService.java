package com.taskmanager.user;

import com.taskmanager.common.exception.EmailAlreadyUsedException;
import com.taskmanager.security.JwtService;
import com.taskmanager.security.RefreshTokenService;
import com.taskmanager.user.dto.AuthResponse;
import com.taskmanager.user.dto.LoginRequest;
import com.taskmanager.user.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalize(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyUsedException(email);
        }
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .build();
        userRepository.save(user);
        return issue(user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalize(request.email());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("invalid credentials"));
        return issue(user);
    }

    public AuthResponse refresh(String rawRefreshToken) {
        RefreshTokenService.RotationResult result = refreshTokenService.rotate(rawRefreshToken);
        return new AuthResponse(jwtService.generateToken(result.email()), result.email(),
                result.token().rawToken());
    }

    public void logout(String rawRefreshToken) {
        refreshTokenService.revokeFamilyOf(rawRefreshToken);
    }

    private AuthResponse issue(User user) {
        return new AuthResponse(jwtService.generateToken(user.getEmail()), user.getEmail(),
                refreshTokenService.issue(user).rawToken());
    }

    private String normalize(String email) {
        return email.trim().toLowerCase();
    }
}
