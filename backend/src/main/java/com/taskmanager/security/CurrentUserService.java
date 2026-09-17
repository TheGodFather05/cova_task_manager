package com.taskmanager.security;

import com.taskmanager.common.exception.ResourceNotFoundException;
import com.taskmanager.user.User;
import com.taskmanager.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    // identity comes from the security context only, never from a request parameter or body
    public User require() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("no authenticated user");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("no authenticated user"));
    }

    public Long requireId() {
        return require().getId();
    }
}
