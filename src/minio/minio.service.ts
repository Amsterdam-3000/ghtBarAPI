import { Client as MinioClient } from 'minio';
import { ImageUpload } from '../image/image.upload.model';

class MinioService {
  private minioClient: MinioClient;

  constructor() {
    this.minioClient = new MinioClient({
      port: Number(process.env.MINIO_PORT),
      endPoint: process.env.MINIO_ENDPOINT,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      useSSL: process.env.MINIO_USE_SSL === 'true',
    });
  }

  public putImage = async (uploadImage: ImageUpload) => {
    await this.minioClient.putObject(
      process.env.MINIO_BUCKET,
      process.env.MINIO_PATH_IMAGE.replace('%id', uploadImage.filename),
      uploadImage.stream,
      {
        'Content-Type': uploadImage.mimetype,
      },
    );
  };

  public deleteImage = async (imageId: string) => {
    await this.minioClient.removeObject(
      process.env.MINIO_BUCKET,
      process.env.MINIO_PATH_IMAGE.replace('%id', imageId),
    );
  };

  public deleteImages = async (imageIds: string[]) => {
    await this.minioClient.removeObjects(
      process.env.MINIO_BUCKET,
      imageIds.map((imageId) =>
        process.env.MINIO_PATH_IMAGE.replace('%id', imageId),
      ),
    );
  };
}

export const minioService = new MinioService();
