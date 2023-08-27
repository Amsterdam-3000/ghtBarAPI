import { Field, ObjectType } from 'type-graphql';

import { IImageFlag } from '../../image/image.flag';

@ObjectType({
  description: 'Country image: object with links to flag images of the country',
})
export class CountryImage implements IImageFlag {
  @Field({ description: 'Link to the SVG image' })
  urlSvg: string;
  @Field({ description: 'Link to the PNG image with 40px width' })
  urlPng40: string;
  @Field({ description: 'Link to the PNG image with 80px width' })
  urlPng80: string;
  @Field({ description: 'Link to the PNG image with 160px width' })
  urlPng160: string;
  @Field({ description: 'Link to the PNG image with 320px width' })
  urlPng320: string;
  @Field({ description: 'Link to the PNG image with 640px width' })
  urlPng640: string;
  @Field({ description: 'Link to the PNG image with 1280px width' })
  urlPng1280: string;
  @Field({ description: 'Link to the PNG image with 2560px width' })
  urlPng2560: string;
}
