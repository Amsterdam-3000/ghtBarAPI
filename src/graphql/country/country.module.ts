import { Module } from '@nestjs/common';
import { IsEmpty } from 'class-validator';

import {
  AggregateCountryResolver,
  applyInputTypesEnhanceMap,
  CountryRelationsResolver,
  FindFirstCountryOrThrowResolver,
  FindManyCountryResolver,
  FindUniqueCountryOrThrowResolver,
  GroupByCountryResolver,
} from '@generated/type-graphql';
import { ComputeFieldsCountryResolver } from './country.resolver';

//TODO Delete this validations (TypeGraphQL Prisma plugin should do it)
applyInputTypesEnhanceMap({
  CountryCreateNestedOneWithoutItemsInput: {
    fields: { create: [IsEmpty()], connectOrCreate: [IsEmpty()] },
  },
  CountryUpdateOneWithoutItemsNestedInput: {
    fields: {
      create: [IsEmpty()],
      connectOrCreate: [IsEmpty()],
      update: [IsEmpty()],
      upsert: [IsEmpty()],
      delete: [IsEmpty()],
    },
  },
});

@Module({
  imports: [],
  providers: [
    //Queries
    AggregateCountryResolver,
    FindFirstCountryOrThrowResolver,
    FindManyCountryResolver,
    FindUniqueCountryOrThrowResolver,
    GroupByCountryResolver,
    CountryRelationsResolver,
    //Computed Fields
    ComputeFieldsCountryResolver,
  ],
})
export class CountryModule {}
