import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';

import { ImageUpload } from '../image/image.upload';
import { LoggerService } from '../logger/logger.service';

export class MinioClient {
  protected minioClient: Client;
  protected readonly bucket: string;
  protected imagePath: string;

  constructor(private config: ConfigService, protected logger: LoggerService) {
    this.minioClient = new Client({
      port: Number(config.get<number>('MINIO_PORT')),
      endPoint: config.get<string>('MINIO_ENDPOINT'),
      accessKey: config.get<string>('MINIO_ACCESS_KEY'),
      secretKey: config.get<string>('MINIO_SECRET_KEY'),
      useSSL: config.get<boolean>('MINIO_USE_SSL') === true,
    });
    this.bucket = config.get<string>('MINIO_BUCKET');
    this.imagePath = config.get<string>('MINIO_PATH_IMAGE');
  }

  public putImage = async (uploadImage: ImageUpload) => {
    this.logger.log(
      `Putting image "${uploadImage.filename}" (${uploadImage.mimetype}) to "${
        this.bucket
      }/${this.imagePath.replace('%id', '')}"`,
      MinioClient.name,
    );

    await this.minioClient.putObject(
      this.bucket,
      this.imagePath.replace('%id', uploadImage.filename),
      uploadImage.stream,
      {
        'Content-Type': uploadImage.mimetype,
      },
    );
  };

  public deleteImage = async (imageId: string) => {
    this.logger.log(
      `Deleting image "${imageId}" from "${
        this.bucket
      }/${this.imagePath.replace('%id', '')}"`,
      MinioClient.name,
    );

    await this.minioClient.removeObject(
      this.bucket,
      this.imagePath.replace('%id', imageId),
    );
  };

  public deleteImages = async (imageIds: string[]) => {
    this.logger.log(
      `Deleting images [${imageIds}] from "${
        this.bucket
      }/${this.imagePath.replace('%id', '')}"`,
      MinioClient.name,
    );

    await this.minioClient.removeObjects(
      this.bucket,
      imageIds.map((imageId) => this.imagePath.replace('%id', imageId)),
    );
  };
}
