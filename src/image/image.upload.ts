import { LoggerService } from '../logger/logger.service';

export interface IImageUpload {
  mimetype?: string;
  filename?: string;
  name?: string;
  createReadStream?: () => any;
}

export class ImageUpload {
  constructor(
    private image: IImageUpload,
    private logger: LoggerService,
  ) {}

  public uploadOrThrow = async (): Promise<void> => {
    this.logger.log('Checking uploaded image', ImageUpload.name);

    if (!this.image) {
      throw new Error('Image must not be null.');
    }
    try {
      this.image.mimetype = (
        await (
          await import('file-type')
        ).fileTypeFromStream(this.image.createReadStream())
      ).mime;
    } catch (error) {
      throw new Error('Image upload error.');
    }
    if (!this.image.mimetype?.startsWith('image/')) {
      throw new Error('Image type error.');
    }
    this.image.name = this.image.filename.replace(/\.[^/.]+$/, '');
  };

  public get mimetype() {
    return this.image.mimetype;
  }

  public get stream() {
    return this.image.createReadStream();
  }

  public get filename() {
    return this.image.filename;
  }

  public set filename(filename: string) {
    this.image.filename = filename;
  }

  public get name() {
    return this.image.name;
  }
}
