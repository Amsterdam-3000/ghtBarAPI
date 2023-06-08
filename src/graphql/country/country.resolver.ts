import { FieldResolver, Resolver, Root } from 'type-graphql';
import { Country } from '@generated/type-graphql';
import { CountryImage } from './country.type';

@Resolver(() => Country)
export class ComputeFieldsCountryResolver {
  @FieldResolver(() => CountryImage, { nullable: true })
  image(@Root() country) {
    return country.image;
  }
}
