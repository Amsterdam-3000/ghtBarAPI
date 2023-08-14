import { FieldResolver, Resolver, Root } from 'type-graphql';
import { Country } from '@generated/type-graphql';

import { CountryImage } from './graphql.country.type';

@Resolver(() => Country)
export class ComputeFieldsCountryResolver {
  @FieldResolver(() => CountryImage, { nullable: true })
  image(@Root() country: Country & { image: CountryImage }): CountryImage {
    return country.image;
  }
}
