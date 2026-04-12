import dotenv from 'dotenv';
dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = process.env.PORT || 3000;
export const IS_DEV = NODE_ENV === 'development';
export const IS_PROD = NODE_ENV === 'production';

export default {
  NODE_ENV,
  PORT,
  IS_DEV,
  IS_PROD,
};
