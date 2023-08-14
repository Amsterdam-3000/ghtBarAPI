import { configSchema } from './config.schema';

describe('ConfigSchema', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should set defaults', () => {
    const { value } = configSchema.validate({}, { abortEarly: false });
    expect(value.NODE_ENV).toEqual('development');
    expect(value.PORT).toEqual(3000);
    expect(value.APOLLO_SERVER_INTROSPECTION).toBeFalsy();
    expect(value.APOLLO_SERVER_ERROR_STACKTRACE).toBeFalsy();
    expect(value.MINIO_PORT).toEqual(9000);
    expect(value.MINIO_USE_SSL).toBeFalsy();
    expect(value.THROTTLER_TTL).toEqual(60);
    expect(value.THROTTLER_LIMIT).toEqual(60);
    expect(value.THROTTLER_SIGNUP_TTL).toEqual(60);
    expect(value.THROTTLER_SIGNUP_LIMIT).toEqual(1);
    expect(value.GRAPHQL_COMPLEXITY_LIMIT).toEqual(100);
    expect(value.GRAPHQL_DEPTH_LIMIT).toEqual(4);
    expect(value.CACHE_MAX_AGE).toEqual(60);
    expect(value.IMAGE_UPLOAD_MAX_SIZE).toEqual(30000000);
    expect(value.IMAGE_UPLOAD_MAX_FILES).toEqual(30);
  });

  it('should return error for required config', () => {
    const { error } = configSchema.validate({}, { abortEarly: false });
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: '"DATABASE_URL" is required' }),
        expect.objectContaining({ message: '"JWT_SECRET" is required' }),
        expect.objectContaining({ message: '"JWT_EXPIRES_IN" is required' }),
        expect.objectContaining({ message: '"FLAG_CDN_URL" is required' }),
        expect.objectContaining({ message: '"MINIO_ENDPOINT" is required' }),
        expect.objectContaining({ message: '"MINIO_ACCESS_KEY" is required' }),
        expect.objectContaining({ message: '"MINIO_SECRET_KEY" is required' }),
        expect.objectContaining({ message: '"MINIO_BUCKET" is required' }),
        expect.objectContaining({ message: '"MINIO_PATH_IMAGE" is required' }),
        expect.objectContaining({ message: '"IMGPROXY_BASE_URL" is required' }),
        expect.objectContaining({ message: '"IMGPROXY_PATH_S3" is required' }),
        expect.objectContaining({ message: '"IMGPROXY_KEY" is required' }),
        expect.objectContaining({ message: '"IMGPROXY_SALT" is required' }),
        expect.objectContaining({ message: '"CORS_ORIGIN" is required' }),
      ]),
    );
  });

  it('should return error for invalid node environment', () => {
    const { error } = configSchema.validate(
      { NODE_ENV: 'invalid' },
      { abortEarly: false },
    );
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: '"NODE_ENV" must be one of [development, production, test]',
        }),
      ]),
    );
  });

  it('should return error for invalid port', () => {
    let { error } = configSchema.validate(
      { PORT: 'invalid', MINIO_PORT: 'invalid' },
      { abortEarly: false },
    );
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: '"PORT" must be a number' }),
        expect.objectContaining({ message: '"MINIO_PORT" must be a number' }),
      ]),
    );
    error = configSchema.validate(
      { PORT: 50000, MINIO_PORT: 1000 },
      { abortEarly: false },
    ).error;
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: '"PORT" must be less than or equal to 49151',
        }),
        expect.objectContaining({
          message: '"MINIO_PORT" must be greater than or equal to 1024',
        }),
      ]),
    );
  });

  it('should return error for invalid flag', () => {
    const { error } = configSchema.validate(
      {
        MINIO_USE_SSL: 'X',
        APOLLO_SERVER_INTROSPECTION: 0,
        APOLLO_SERVER_ERROR_STACKTRACE: '1',
      },
      { abortEarly: false },
    );
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: '"MINIO_USE_SSL" must be a boolean',
        }),
        expect.objectContaining({
          message: '"APOLLO_SERVER_INTROSPECTION" must be a boolean',
        }),
        expect.objectContaining({
          message: '"APOLLO_SERVER_ERROR_STACKTRACE" must be a boolean',
        }),
      ]),
    );
  });

  it('should return error for invalid url', () => {
    const { error } = configSchema.validate(
      {
        DATABASE_URL: 'https://invalid.com',
        FLAG_CDN_URL: 'ftp://invalid.com',
        MINIO_ENDPOINT: '/invalid',
        MINIO_PATH_IMAGE: 'https://invalid.com',
        IMGPROXY_BASE_URL: 'ftp://invalid.com',
        IMGPROXY_PATH_S3: 'https://invalid.com',
      },
      { abortEarly: false },
    );
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            '"DATABASE_URL" must be a valid uri with a scheme matching the postgresql|mysql|sqlserver pattern',
        }),
        expect.objectContaining({
          message:
            '"FLAG_CDN_URL" must be a valid uri with a scheme matching the https? pattern',
        }),
        expect.objectContaining({
          message:
            '"FLAG_CDN_URL" with value "ftp://invalid.com" fails to match the required pattern: /%width.+%id\\.%ext$/',
        }),
        expect.objectContaining({
          message: '"MINIO_ENDPOINT" must be a valid hostname',
        }),
        expect.objectContaining({
          message: '"MINIO_PATH_IMAGE" must be a valid relative uri',
        }),
        expect.objectContaining({
          message:
            '"MINIO_PATH_IMAGE" with value "https://invalid.com" fails to match the required pattern: /%id$/',
        }),
        expect.objectContaining({
          message:
            '"IMGPROXY_BASE_URL" must be a valid uri with a scheme matching the https? pattern',
        }),
        expect.objectContaining({
          message:
            '"IMGPROXY_BASE_URL" with value "ftp://invalid.com" fails to match the required pattern: /\\/%sign\\/.+%width\\/plain\\//',
        }),
        expect.objectContaining({
          message:
            '"IMGPROXY_PATH_S3" must be a valid uri with a scheme matching the s3 pattern',
        }),
        expect.objectContaining({
          message:
            '"IMGPROXY_PATH_S3" with value "https://invalid.com" fails to match the required pattern: /%id$/',
        }),
      ]),
    );
  });

  it('should return error for invalid key', () => {
    const { error } = configSchema.validate(
      {
        JWT_SECRET: 'invalid?',
        MINIO_ACCESS_KEY: 'invalid?',
        MINIO_SECRET_KEY: 'invalid?',
        IMGPROXY_KEY: 'invalid',
        IMGPROXY_SALT: 'invalid',
      },
      { abortEarly: false },
    );
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: '"JWT_SECRET" must only contain alpha-numeric characters',
        }),
        expect.objectContaining({
          message:
            '"MINIO_ACCESS_KEY" must only contain alpha-numeric characters',
        }),
        expect.objectContaining({
          message:
            '"MINIO_SECRET_KEY" must only contain alpha-numeric characters',
        }),
        expect.objectContaining({
          message: '"IMGPROXY_KEY" must only contain hexadecimal characters',
        }),
        expect.objectContaining({
          message: '"IMGPROXY_KEY" length must be 64 characters long',
        }),
        expect.objectContaining({
          message: '"IMGPROXY_SALT" must only contain hexadecimal characters',
        }),
        expect.objectContaining({
          message: '"IMGPROXY_SALT" length must be 64 characters long',
        }),
      ]),
    );
  });

  it('should return error for invalid bucket', () => {
    let { error } = configSchema.validate(
      { MINIO_BUCKET: 'IN' },
      { abortEarly: false },
    );
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: '"MINIO_BUCKET" length must be at least 3 characters long',
        }),
      ]),
    );
    error = configSchema.validate(
      { MINIO_BUCKET: 'INVALID_NAME' },
      { abortEarly: false },
    ).error;
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            '"MINIO_BUCKET" with value "invalid_name" fails to match the required pattern: /^[a-z0-9-.]+$/',
        }),
      ]),
    );
    error = configSchema.validate(
      {
        MINIO_BUCKET:
          '1234567890123456789012345678901234567890123456789012345678901234567890',
      },
      { abortEarly: false },
    ).error;
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            '"MINIO_BUCKET" length must be less than or equal to 63 characters long',
        }),
      ]),
    );
  });

  it('should return error for invalid number parameter', () => {
    const { error } = configSchema.validate(
      {
        THROTTLER_TTL: -1,
        THROTTLER_LIMIT: -1,
        THROTTLER_SIGNUP_TTL: -1,
        THROTTLER_SIGNUP_LIMIT: -1,
        GRAPHQL_COMPLEXITY_LIMIT: -1,
        GRAPHQL_DEPTH_LIMIT: -1,
        CACHE_MAX_AGE: -1,
        IMAGE_UPLOAD_MAX_SIZE: -1,
        IMAGE_UPLOAD_MAX_FILES: -1,
      },
      { abortEarly: false },
    );
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: '"THROTTLER_TTL" must be greater than or equal to 0',
        }),
        expect.objectContaining({
          message: '"THROTTLER_LIMIT" must be greater than or equal to 0',
        }),
        expect.objectContaining({
          message: '"THROTTLER_SIGNUP_TTL" must be greater than or equal to 0',
        }),
        expect.objectContaining({
          message:
            '"THROTTLER_SIGNUP_LIMIT" must be greater than or equal to 0',
        }),
        expect.objectContaining({
          message:
            '"GRAPHQL_COMPLEXITY_LIMIT" must be greater than or equal to 0',
        }),
        expect.objectContaining({
          message: '"GRAPHQL_DEPTH_LIMIT" must be greater than or equal to 0',
        }),
        expect.objectContaining({
          message: '"CACHE_MAX_AGE" must be greater than or equal to 0',
        }),
        expect.objectContaining({
          message: '"IMAGE_UPLOAD_MAX_SIZE" must be greater than or equal to 0',
        }),
        expect.objectContaining({
          message:
            '"IMAGE_UPLOAD_MAX_FILES" must be greater than or equal to 0',
        }),
      ]),
    );
  });
});
