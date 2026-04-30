const validateRequest = (schema, source = "body") => (req, res, next) => {
  
  const result = schema.safeParse(req[source] ?? {});

  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path?.[0];
    const message =
      issue?.message === 'Required' && field
        ? `${field} is required`
        : issue?.message || 'Invalid request payload';

    const error = new Error(message);
    error.statusCode = 400;
    return next(error);
  }

  req[source] = result.data;
  return next();
};

export default validateRequest;
