import { Field, ObjectType } from 'type-graphql';

import { IImageProxy } from '../../image/image.proxy';

@ObjectType()
export class ItemImage implements IImageProxy {
  @Field()
  urlJpg: string;
  @Field()
  urlJpg100: string;
  @Field()
  urlJpg300: string;
  @Field()
  urlJpg500: string;
  @Field()
  urlJpg750: string;
  @Field()
  urlJpg1000: string;
  @Field()
  urlJpg1500: string;
  @Field()
  urlJpg2500: string;
}
