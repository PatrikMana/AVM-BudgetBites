package com.example.budgetbites;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex,
                                                            HttpServletRequest request) {
        List<ApiFieldError> fields = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> new ApiFieldError(err.getField(), err.getDefaultMessage()))
                .toList();

        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(),
                400,
                HttpStatus.BAD_REQUEST.toString(),
                "Validation failed",
                request.getRequestURI(),
                fields
        );

        return ResponseEntity.status(400).body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleBadJson(HttpMessageNotReadableException ex,
                                                         HttpServletRequest request) {
        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(),
                400,
                HttpStatus.BAD_REQUEST.toString(),
                "Invalid JSON",
                request.getRequestURI(),
                null
        );
        return ResponseEntity.status(400).body(body);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(ResponseStatusException ex,
                                                                 HttpServletRequest request) {
        int status = ex.getStatusCode().value();
        String error = ex.getStatusCode().toString();
        String message = ex.getReason() != null ? ex.getReason() : "Request failed";

        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(),
                status,
                error,
                message,
                request.getRequestURI(),
                null
        );

        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(),
                500,
                HttpStatus.INTERNAL_SERVER_ERROR.toString(),
                "Internal server error",
                request.getRequestURI(),
                null
        );

        return ResponseEntity.status(500).body(body);
    }
}