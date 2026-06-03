import { ZodError } from 'zod';
import ApiError from './ApiError.js';

/**
 * Express middleware that validates `req[source]` against a Zod schema.
 * Replaces the original value with the parsed (and possibly coerced) version.
 */
const validate = (schema, source = 'body') => (req, _res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    next(err);
  }
};

export default validate;
