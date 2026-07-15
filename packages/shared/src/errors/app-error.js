export class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 500, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
    }
}
export class NotFoundError extends AppError {
    constructor(resource) {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}
export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}
export class ConflictError extends AppError {
    constructor(message) {
        super(message, 409, 'CONFLICT');
    }
}
export class ValidationError extends AppError {
    constructor(message) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}
export function createErrorResponse(error) {
    if (error instanceof AppError) {
        return { error: error.message, code: error.code, statusCode: error.statusCode };
    }
    return { error: 'Internal Server Error', code: 'INTERNAL_ERROR', statusCode: 500 };
}
