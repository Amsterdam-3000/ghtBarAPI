import { configSchema } from './config.schema';

describe('ConfigSchema', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should set defaults', () => {
    const { value } = configSchema.validate({}, { abortEarly: false });
    expect(Object.keys(value)).toBeArrayOfSize(16);
    expect(value.NODE_ENV).toEqual('development');
    expect(value.PORT).toEqual(3000);
    expect(value.S3_PORT).toEqual(9000);
    expect(value.S3_ROOT_USER).toEqual('root');
    expect(value.S3_FOLDER_IMAGES).toEqual('images');
    expect(value.APOLLO_SERVER_INTROSPECTION).toBeFalsy();
    expect(value.APOLLO_SERVER_ERROR_STACKTRACE).toBeFalsy();
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
    expect(error.details).toBeArrayOfSize(16);
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: '"HOST" is required' }),
        expect.objectContaining({ message: '"DB_ROOT_PASSWORD" is required' }),
        expect.objectContaining({ message: '"DB_NAME" is required' }),
        expect.objectContaining({ message: '"DATABASE_URL" is required' }),
        expect.objectContaining({ message: '"JWT_SECRET" is required' }),
        expect.objectContaining({ message: '"JWT_EXPIRES_IN" is required' }),
        expect.objectContaining({ message: '"S3_HOST" is required' }),
        expect.objectContaining({ message: '"S3_ROOT_PASSWORD" is required' }),
        expect.objectContaining({ message: '"S3_BUCKET" is required' }),
        expect.objectContaining({ message: '"S3_PATH_IMAGE" is required' }),
        expect.objectContaining({ message: '"IMGPROXY_BASE_URL" is required' }),
        expect.objectContaining({ message: '"IMGPROXY_PATH_S3" is required' }),
        expect.objectContaining({ message: '"IMGPROXY_KEY" is required' }),
        expect.objectContaining({ message: '"IMGPROXY_SALT" is required' }),
        expect.objectContaining({ message: '"FLAG_CDN_URL" is required' }),
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
      { PORT: 'invalid', S3_PORT: 'invalid' },
      { abortEarly: false },
    );
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: '"PORT" must be a number' }),
        expect.objectContaining({ message: '"S3_PORT" must be a number' }),
      ]),
    );
    error = configSchema.validate(
      { PORT: -1, S3_PORT: -1 },
      { abortEarly: false },
    ).error;
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: '"PORT" must be a valid port' }),
        expect.objectContaining({ message: '"S3_PORT" must be a valid port' }),
      ]),
    );
  });

  it('should return error for invalid flag', () => {
    const { error } = configSchema.validate(
      {
        APOLLO_SERVER_INTROSPECTION: 0,
        APOLLO_SERVER_ERROR_STACKTRACE: '1',
      },
      { abortEarly: false },
    );
    expect(error.details).toEqual(
      expect.arrayContaining([
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
        HOST: '/invalid',
        DATABASE_URL: 'https://invalid.com',
        S3_HOST: '/invalid',
        S3_PATH_IMAGE: 'https://invalid.com',
        IMGPROXY_BASE_URL: 'ftp://invalid.com',
        IMGPROXY_PATH_S3: 'https://invalid.com',
        FLAG_CDN_URL: 'ftp://invalid.com',
      },
      { abortEarly: false },
    );
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: '"HOST" must be a valid hostname',
        }),
        expect.objectContaining({
          message:
            '"DATABASE_URL" must be a valid uri with a scheme matching the postgresql|mysql|sqlserver pattern',
        }),
        expect.objectContaining({
          message: '"S3_HOST" must be a valid hostname',
        }),
        expect.objectContaining({
          message: '"S3_PATH_IMAGE" must be a valid relative uri',
        }),
        expect.objectContaining({
          message:
            '"S3_PATH_IMAGE" with value "https://invalid.com" fails to match the required pattern: /%id$/',
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
        expect.objectContaining({
          message:
            '"FLAG_CDN_URL" must be a valid uri with a scheme matching the https? pattern',
        }),
        expect.objectContaining({
          message:
            '"FLAG_CDN_URL" with value "ftp://invalid.com" fails to match the required pattern: /%width.+%id\\.%ext$/',
        }),
      ]),
    );
  });

  it('should return error for invalid key', () => {
    const { error } = configSchema.validate(
      {
        JWT_SECRET: 'invalid?',
        DB_ROOT_PASSWORD: 'invali?',
        S3_ROOT_PASSWORD: 'invali?',
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
            '"DB_ROOT_PASSWORD" must only contain alpha-numeric characters',
        }),
        expect.objectContaining({
          message:
            '"DB_ROOT_PASSWORD" length must be at least 8 characters long',
        }),
        expect.objectContaining({
          message:
            '"S3_ROOT_PASSWORD" must only contain alpha-numeric characters',
        }),
        expect.objectContaining({
          message:
            '"S3_ROOT_PASSWORD" length must be at least 8 characters long',
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

  it('should return error for invalid username', () => {
    let { error } = configSchema.validate(
      { S3_ROOT_USER: 'IN?' },
      { abortEarly: false },
    );
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: '"S3_ROOT_USER" must only contain alpha-numeric characters',
        }),
        expect.objectContaining({
          message: '"S3_ROOT_USER" length must be at least 4 characters long',
        }),
      ]),
    );
  });

  it('should return error for invalid folder', () => {
    let { error } = configSchema.validate(
      { S3_BUCKET: 'IN', DB_NAME: 'IN', S3_FOLDER_IMAGES: 'IN' },
      { abortEarly: false },
    );
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: '"S3_BUCKET" length must be at least 3 characters long',
        }),
        expect.objectContaining({
          message: '"DB_NAME" length must be at least 3 characters long',
        }),
        expect.objectContaining({
          message:
            '"S3_FOLDER_IMAGES" length must be at least 3 characters long',
        }),
      ]),
    );
    error = configSchema.validate(
      { S3_BUCKET: 'INVALID_NAME' },
      { abortEarly: false },
    ).error;
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            '"S3_BUCKET" with value "invalid_name" fails to match the required pattern: /^[a-z0-9-.]+$/',
        }),
      ]),
    );
    error = configSchema.validate(
      {
        S3_BUCKET:
          '1234567890123456789012345678901234567890123456789012345678901234567890',
        DB_NAME:
          '1234567890123456789012345678901234567890123456789012345678901234567890',
        S3_FOLDER_IMAGES:
          '1234567890123456789012345678901234567890123456789012345678901234567890',
      },
      { abortEarly: false },
    ).error;
    expect(error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            '"S3_BUCKET" length must be less than or equal to 63 characters long',
        }),
        expect.objectContaining({
          message:
            '"DB_NAME" length must be less than or equal to 63 characters long',
        }),
        expect.objectContaining({
          message:
            '"S3_FOLDER_IMAGES" length must be less than or equal to 63 characters long',
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
