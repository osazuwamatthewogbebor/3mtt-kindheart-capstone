const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const error = new Error(result.error.issues[0]?.message || 'Invalid request payload');
    error.statusCode = 400;
    return next(error);
  }

  req.body = result.data;
  return next();
};

export default validateRequest;
