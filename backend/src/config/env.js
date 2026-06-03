import dotenv from 'dotenv';
dotenv.config();
import path from 'path';

const required = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),

  mongoUri: required("MONGODB_URI", "mongodb://127.0.0.1:27017/digsign"),

  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  resetTokenExpiresIn: process.env.RESET_TOKEN_EXPIRES_IN || "1h",

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  uploadDir: path.resolve(process.env.UPLOAD_DIR || "./storage"),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || "25", 10),
};

env.isProd = env.nodeEnv === "production";
env.isDev = env.nodeEnv === "development";

export default env;
