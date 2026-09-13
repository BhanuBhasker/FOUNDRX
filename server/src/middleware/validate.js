import { ApiError } from '../utils/ApiError.js';

/**
 * Validates req.body (or req.query) against a Zod schema, replacing it
 * with the parsed/coerced value on success.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(ApiError.badRequest('Validation failed', result.error.flatten()));
    }
    req[source] = result.data;
    next();
  };
}
