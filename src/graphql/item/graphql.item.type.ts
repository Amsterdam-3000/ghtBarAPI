import { Field, ObjectType } from 'type-graphql';

import { IImageProxy } from '../../image/image.proxy';

@ObjectType({
  description: 'Item image: object with links to images of the item',
})
export class ItemImage implements IImageProxy {
  @Field({ description: 'Link to the original JPG image' })
  urlJpg: string;
  @Field({ description: 'Link to the JPG image with 100px width' })
  urlJpg100: string;
  @Field({ description: 'Link to the JPG image with 300px width' })
  urlJpg300: string;
  @Field({ description: 'Link to the JPG image with 500px width' })
  urlJpg500: string;
  @Field({ description: 'Link to the JPG image with 750px width' })
  urlJpg750: string;
  @Field({ description: 'Link to the JPG image with 1000px width' })
  urlJpg1000: string;
  @Field({ description: 'Link to the JPG image with 1500px width' })
  urlJpg1500: string;
  @Field({ description: 'Link to the JPG image with 2500px width' })
  urlJpg2500: string;
}
