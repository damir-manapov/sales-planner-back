import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError, ZodIssue } from 'zod';

/**
 * Validation pipe for query parameters using Zod schemas
 * Extracts and validates query parameters, throwing BadRequestException on failure
 */
@Injectable()
export class QueryValidationPipe<T> implements PipeTransform {
  constructor(private schema: ZodSchema<T>) {}

  transform(value: unknown, metadata: ArgumentMetadata): T {
    // Only validate if we're dealing with query parameters
    if (metadata.type !== 'custom') {
      return value as T;
    }

    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((err: ZodIssue) => {
          const path = err.path.join('.');
          return path ? `${path}: ${err.message}` : err.message;
        });
        throw new BadRequestException({
          message: 'Query validation failed',
          errors: messages,
        });
      }
      throw error;
    }
  }
}
