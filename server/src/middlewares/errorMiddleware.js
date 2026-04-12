import logger from '../config/logger.js';
import { IS_DEV } from '../config/env.js';

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  logger.error(`${err.message} - ${req.method} ${req.url}`);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: IS_DEV ? err.stack : undefined,
  });
};

export default errorMiddleware;
