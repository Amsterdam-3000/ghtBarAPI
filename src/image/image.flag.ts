import { ConfigService } from '@nestjs/config';

import { LoggerService } from '../logger/logger.service';

export interface IImageFlag {
  urlSvg: string;
  urlPng40?: string;
  urlPng80?: string;
  urlPng160?: string;
  urlPng320?: string;
  urlPng640?: string;
  urlPng1280?: string;
  urlPng2560?: string;
}

export class ImageFlag {
  private imageUrls: IImageFlag;

  constructor(
    private config: ConfigService,
    private logger: LoggerService,
    private countryId: string,
  ) {}

  public getImageUrls = (): IImageFlag => {
    if (!this.countryId) return null;
    this.logger.log(
      `Computing image urls for country "${this.countryId}"`,
      ImageFlag.name,
    );

    if (this.imageUrls) return this.imageUrls;

    const id = this.countryId.toLowerCase();
    const urlImage = this.config.get<string>('FLAG_CDN_URL').replace('%id', id);

    this.imageUrls = {
      urlSvg: urlImage.replace('/w%width', '').replace('%ext', 'svg'),
      urlPng40: urlImage.replace('%width', '40').replace('%ext', 'png'),
      urlPng80: urlImage.replace('%width', '80').replace('%ext', 'png'),
      urlPng160: urlImage.replace('%width', '160').replace('%ext', 'png'),
      urlPng320: urlImage.replace('%width', '320').replace('%ext', 'png'),
      urlPng640: urlImage.replace('%width', '640').replace('%ext', 'png'),
      urlPng1280: urlImage.replace('%width', '1280').replace('%ext', 'png'),
      urlPng2560: urlImage.replace('%width', '2560').replace('%ext', 'png'),
    };

    return this.imageUrls;
  };
}
