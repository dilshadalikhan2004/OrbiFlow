from fastapi import status

class BaseAPIException(Exception):
    code: str = "INTERNAL_SERVER_ERROR"
    message: str = "An unexpected error occurred"
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(self, message: str = None, code: str = None):
        if message: self.message = message
        if code: self.code = code

class EntityNotFoundException(BaseAPIException):
    code = "NOT_FOUND"
    message = "The requested entity was not found"
    status_code = status.HTTP_404_NOT_FOUND

class InsufficientPermissionsException(BaseAPIException):
    code = "INSUFFICIENT_PERMISSIONS"
    message = "You do not have the required role to perform this action"
    status_code = status.HTTP_403_FORBIDDEN

class AuthenticationFailedException(BaseAPIException):
    code = "AUTH_FAILED"
    message = "Invalid credentials or expired token"
    status_code = status.HTTP_401_UNAUTHORIZED

class ValidationException(BaseAPIException):
    code = "VALIDATION_ERROR"
    message = "The provided data is invalid"
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
