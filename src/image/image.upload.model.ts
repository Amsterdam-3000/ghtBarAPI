import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';

export class ImageUpload {
  private image;

  constructor(private uploadImage: GraphQLUpload) {}

  public uploadOrThrow = async () => {
    if (!this.uploadImage) {
      throw new Error('Image must not be null.');
    }
    try {
      this.image = await this.uploadImage;
      this.image.mimetype = (
        await (
          await import('file-type')
        ).fileTypeFromStream(this.image.createReadStream())
      ).mime;
    } catch {
      throw new Error('Image upload error.');
    }
    if (!this.image.mimetype || !this.image.mimetype.startsWith('image/')) {
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
