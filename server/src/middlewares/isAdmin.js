export const isAdmin = (req, res, next) => {
  if (!req.user) {
    const error = new Error('Not authorized. User context is missing.');
    error.statusCode = 401;
    return next(error);
  }

  if (req.user.role !== 'ADMIN') {
    const error = new Error('Admin access only');
    error.statusCode = 403;
    return next(error);
  }

  return next();
};

export default isAdmin;
