import { createHmac } from 'node:crypto';

export interface IImageProxy {
  urlJpg: string;
  urlJpg100: string;
  urlJpg300: string;
  urlJpg500: string;
  urlJpg750: string;
  urlJpg1000: string;
  urlJpg1500: string;
  urlJpg2500: string;
}

export class ImageProxy {
  private imageUrls: IImageProxy;

  constructor(private imageId: string) {}

  private get s3Url(): string {
    return process.env.IMGPROXY_BASE_URL + process.env.IMGPROXY_PATH_S3;
  }

  private signUrl = (imageUrl: string): string => {
    const urlPath = imageUrl.split('%sign')[1];
    const hmac = createHmac(
      'sha256',
      Buffer.from(process.env.IMGPROXY_KEY, 'hex'),
    );
    hmac.update(Buffer.from(process.env.IMGPROXY_SALT, 'hex'));
    hmac.update(urlPath);
    const signature = hmac.digest('base64url');
    return imageUrl.replace('%sign', signature);
  };

  public getImageUrls = (): IImageProxy => {
    if (this.imageUrls) return this.imageUrls;

    const imageUrl = this.s3Url.replace('%id', this.imageId);

    this.imageUrls = {
      urlJpg: imageUrl.replace('%width', '0'),
      urlJpg100: imageUrl.replace('%width', '100'),
      urlJpg300: imageUrl.replace('%width', '300'),
      urlJpg500: imageUrl.replace('%width', '500'),
      urlJpg750: imageUrl.replace('%width', '750'),
      urlJpg1000: imageUrl.replace('%width', '1000'),
      urlJpg1500: imageUrl.replace('%width', '1500'),
      urlJpg2500: imageUrl.replace('%width', '2500'),
    };

    Object.entries(this.imageUrls).forEach(([key, url]: string[]) => {
      this.imageUrls[key] = this.signUrl(url);
    });

    return this.imageUrls;
  };
}
