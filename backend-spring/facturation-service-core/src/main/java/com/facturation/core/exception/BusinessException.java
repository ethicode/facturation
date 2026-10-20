package com.facturation.core.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final ErrorType type;

    public BusinessException(ErrorType type, String message) {
        super(message);
        this.type = type;
    }

    public static BusinessException badRequest(String message) {
        return new BusinessException(ErrorType.BAD_REQUEST, message);
    }

    public static BusinessException notFound(String message) {
        return new BusinessException(ErrorType.NOT_FOUND, message);
    }

    public static BusinessException conflict(String message) {
        return new BusinessException(ErrorType.CONFLICT, message);
    }

    public static BusinessException unauthorized(String message) {
        return new BusinessException(ErrorType.UNAUTHORIZED, message);
    }
}
