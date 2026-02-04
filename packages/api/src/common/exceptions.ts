import { ConflictException, InternalServerErrorException } from '@nestjs/common';

/**
 * Exception thrown when attempting to create a resource that already exists
 * based on unique constraints (e.g., duplicate email, code, key).
 */
export class DuplicateResourceException extends ConflictException {
  constructor(resource: string, identifier: string, scope?: string) {
    const scopeMessage = scope ? ` in ${scope}` : '';
    super(`${resource} with identifier '${identifier}' already exists${scopeMessage}`);
  }
}

/**
 * Exception for unexpected database errors.
 * Wraps PostgreSQL errors that are not handled by specific exceptions.
 */
export class DatabaseException extends InternalServerErrorException {
  constructor(operation: string, originalError?: Error) {
    super(`Database error during ${operation}: ${originalError?.message ?? 'Unknown error'}`);
  }
}

/**
 * Checks if an error is a PostgreSQL unique constraint violation (error code 23505)
 */
export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === '23505';
}

/**
 * Checks if an error is a PostgreSQL foreign key constraint violation (error code 23503)
 */
export function isForeignKeyViolation(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === '23503';
}
