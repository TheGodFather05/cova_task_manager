package com.taskmanager.common;

import com.taskmanager.common.exception.EmailAlreadyUsedException;
import com.taskmanager.common.exception.InvalidRefreshTokenException;
import com.taskmanager.common.exception.InvalidReportParameterException;
import com.taskmanager.common.exception.ResourceNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fieldError : e.getBindingResult().getFieldErrors()) {
            errors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return status(HttpStatus.BAD_REQUEST, "validation failed", errors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException e) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (ConstraintViolation<?> violation : e.getConstraintViolations()) {
            String path = violation.getPropertyPath().toString();
            errors.putIfAbsent(path.substring(path.lastIndexOf('.') + 1), violation.getMessage());
        }
        return status(HttpStatus.BAD_REQUEST, "validation failed", errors);
    }

    // an unknown enum value in a query param binds as a type mismatch; without this it would be 500
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        Map<String, String> errors = Map.of(e.getName(), acceptedValues(e));
        return status(HttpStatus.BAD_REQUEST, "invalid request parameter", errors);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParameter(MissingServletRequestParameterException e) {
        return status(HttpStatus.BAD_REQUEST, "missing request parameter",
                Map.of(e.getParameterName(), "must be provided"));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadableBody(HttpMessageNotReadableException e) {
        return status(HttpStatus.BAD_REQUEST, "malformed request body", null);
    }

    @ExceptionHandler(InvalidReportParameterException.class)
    public ResponseEntity<ApiError> handleInvalidReportParameter(InvalidReportParameterException e) {
        return status(HttpStatus.BAD_REQUEST, e.getMessage(), null);
    }

    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<ApiError> handleInvalidRefreshToken(InvalidRefreshTokenException e) {
        return status(HttpStatus.UNAUTHORIZED, "invalid refresh token", null);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException e) {
        return status(HttpStatus.NOT_FOUND, e.getMessage(), null);
    }

    @ExceptionHandler(EmailAlreadyUsedException.class)
    public ResponseEntity<ApiError> handleEmailAlreadyUsed(EmailAlreadyUsedException e) {
        return status(HttpStatus.CONFLICT, e.getMessage(), null);
    }

    @ExceptionHandler({BadCredentialsException.class, AuthenticationException.class})
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException e) {
        return status(HttpStatus.UNAUTHORIZED, "invalid credentials", null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException e) {
        return status(HttpStatus.FORBIDDEN, "access denied", null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception e) {
        // message withheld from the client; internals must not leak through the error envelope
        log.error("unhandled exception", e);
        return status(HttpStatus.INTERNAL_SERVER_ERROR, "internal server error", null);
    }

    private String acceptedValues(MethodArgumentTypeMismatchException e) {
        Class<?> type = e.getRequiredType();
        if (type != null && type.isEnum()) {
            return "must be one of " + String.join(", ",
                    java.util.Arrays.stream(type.getEnumConstants()).map(Object::toString).toList());
        }
        return "invalid value";
    }

    private ResponseEntity<ApiError> status(HttpStatus status, String message,
                                            Map<String, String> errors) {
        return ResponseEntity.status(status).body(ApiError.of(status.value(), message, errors));
    }
}
