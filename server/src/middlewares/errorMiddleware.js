import logger from '../config/logger.js';
import { IS_DEV } from '../config/env.js';

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || (err.name === 'MulterError' ? 400 : 500);
  const message =
    err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Maximum allowed size is 2MB'
      : err.message || 'Internal Server Error';
  
  logger.error(`${err.message} - ${req.method} ${req.url}`);

  res.status(statusCode).json({
    success: false,
    message,
    stack: IS_DEV ? err.stack : undefined,
  });
};

export default errorMiddleware;
