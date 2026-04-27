import {z} from 'zod';
import logger from '../config/logger.js';
import { IS_DEV } from '../config/env.js';


const errorMiddleware = (err, req, res, next) => {
  
  // Handle Zod Validation Errors
  if (err instanceof z.ZodError) {

      message = "Validation failed",
      errors = err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message
      }))

    logger.warn(`Validation Error: ${JSON.stringify(errors)}`, {
            url: req.originalUrl,
            method: req.method,
            userId: req.user?.id
        });
    return res.status(400).json({
      status: "error",
      message,
      errors
    })

  }

  // Handle Prisma Known Request Errors
  if (err.code === "P2002") {
    message = "A record with this value already exists."
    logger.warn(`Prisma Known Error:`, {
            url: req.originalUrl,
            method: req.method,
            userId: req.user?.id,
            message,
        });

    return res.status(409).json({
      status: "error",
      message,
    })
  }
  
  const statusCode = err.statusCode || (err.name === 'MulterError' ? 400 : 500);
  const message =
    err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE'
      ? 'File too large. Maximum allowed size is 2MB'
      : err.message || 'Internal Server Error';
  
  logger.error(`${err.message} - ${req.method} ${req.url}`);

  res.status(statusCode).json({
    status: "error",
    success: false,
    message,
    stack: IS_DEV ? err.stack : undefined,
  });
};

export default errorMiddleware;
