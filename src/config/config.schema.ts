import * as Joi from 'joi';

export const configSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  HOST: Joi.string().hostname().required(),
  PORT: Joi.number().port().default(3000),

  DB_ROOT_PASSWORD: Joi.string().alphanum().min(8).required(),
  DB_NAME: Joi.string()
    .pattern(/^[a-z0-9-.]+$/)
    .min(3)
    .max(63)
    .required(),
  DATABASE_URL: Joi.string()
    .uri({ scheme: /postgresql|mysql|sqlserver/ })
    .required(),

  S3_HOST: Joi.string().hostname().required(),
  S3_PORT: Joi.number().port().default(9000),
  S3_ROOT_USER: Joi.string().alphanum().min(4).default('root'),
  S3_ROOT_PASSWORD: Joi.string().alphanum().min(8).required(),
  S3_BUCKET: Joi.string()
    .lowercase()
    .pattern(/^[a-z0-9-.]+$/)
    .min(3)
    .max(63)
    .required(),
  S3_FOLDER_IMAGES: Joi.string().alphanum().min(3).max(63).default('images'),
  S3_PATH_IMAGE: Joi.string()
    .uri({ relativeOnly: true })
    .pattern(/%id$/)
    .required(),

  IMGPROXY_BASE_URL: Joi.string()
    .uri({ scheme: /https?/ })
    .pattern(/\/%sign\/.+%width\/plain\//)
    .required(),
  IMGPROXY_PATH_S3: Joi.string()
    .uri({ scheme: /s3/ })
    .pattern(/%id$/)
    .required(),
  IMGPROXY_KEY: Joi.string().hex().length(64).required(),
  IMGPROXY_SALT: Joi.string().hex().length(64).required(),

  APOLLO_SERVER_INTROSPECTION: Joi.boolean().default(false),
  APOLLO_SERVER_ERROR_STACKTRACE: Joi.boolean().default(false),

  JWT_SECRET: Joi.string().alphanum().required(),
  JWT_EXPIRES_IN: Joi.string().required(),

  FLAG_CDN_URL: Joi.string()
    .uri({ scheme: /https?/ })
    .pattern(/%width.+%id\.%ext$/)
    .required(),

  THROTTLER_TTL: Joi.number().min(0).default(60),
  THROTTLER_LIMIT: Joi.number().min(0).default(60),
  THROTTLER_SIGNUP_TTL: Joi.number().min(0).default(60),
  THROTTLER_SIGNUP_LIMIT: Joi.number().min(0).default(1),

  GRAPHQL_COMPLEXITY_LIMIT: Joi.number().min(0).default(100),
  GRAPHQL_DEPTH_LIMIT: Joi.number().min(0).default(4),

  CACHE_MAX_AGE: Joi.number().min(0).default(60),

  IMAGE_UPLOAD_MAX_SIZE: Joi.number().min(0).default(30000000),
  IMAGE_UPLOAD_MAX_FILES: Joi.number().min(0).default(30),

  CORS_ORIGIN: Joi.string().required(),
});
