import { Field, ObjectType } from 'type-graphql';

import { IImageFlag } from '../../image/image.flag';

@ObjectType()
export class CountryImage implements IImageFlag {
  @Field()
  urlSvg: string;
  @Field()
  urlPng40: string;
  @Field()
  urlPng80: string;
  @Field()
  urlPng160: string;
  @Field()
  urlPng320: string;
  @Field()
  urlPng640: string;
  @Field()
  urlPng1280: string;
  @Field()
  urlPng2560: string;
}
