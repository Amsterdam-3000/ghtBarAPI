import { Module } from '@nestjs/common';
import { Authorized } from 'type-graphql';
import { IsNotEmpty, ValidateNested } from 'class-validator';

import {
  AggregateTypeResolver,
  applyArgsTypesEnhanceMap,
  applyInputTypesEnhanceMap,
  applyResolversEnhanceMap,
  CreateManyTypeResolver,
  CreateOneTypeResolver,
  DeleteManyTypeResolver,
  DeleteOneTypeResolver,
  FindFirstTypeOrThrowResolver,
  FindManyTypeResolver,
  FindUniqueTypeOrThrowResolver,
  GroupByTypeResolver,
  TypeRelationsResolver,
  UpdateManyTypeResolver,
  UpdateOneTypeResolver,
  UpsertOneTypeResolver,
} from '@generated/type-graphql';

applyResolversEnhanceMap({
  Type: {
    createOneType: [Authorized('ADMIN')],
    createManyType: [Authorized('ADMIN')],
    deleteManyType: [Authorized('ADMIN')],
    deleteOneType: [Authorized('ADMIN')],
    updateOneType: [Authorized('ADMIN')],
    updateManyType: [Authorized('ADMIN')],
    upsertOneType: [Authorized('ADMIN')],
  },
});

applyArgsTypesEnhanceMap({
  CreateOneTypeArgs: { fields: { data: [ValidateNested()] } },
  CreateManyTypeArgs: { fields: { data: [ValidateNested()] } },
  UpdateOneTypeArgs: { fields: { data: [ValidateNested()] } },
  UpdateManyTypeArgs: { fields: { data: [ValidateNested()] } },
  UpsertOneTypeArgs: {
    fields: { create: [ValidateNested()], update: [ValidateNested()] },
  },
});

const fieldsValidation = {
  fields: { name: [IsNotEmpty()] },
};

applyInputTypesEnhanceMap({
  TypeCreateNestedOneWithoutItemsInput: {
    fields: { create: [ValidateNested()], connectOrCreate: [ValidateNested()] },
  },
  TypeUpdateOneWithoutItemsNestedInput: {
    fields: {
      create: [ValidateNested()],
      connectOrCreate: [ValidateNested()],
      update: [ValidateNested()],
      upsert: [ValidateNested()],
    },
  },
  TypeCreateOrConnectWithoutItemsInput: {
    fields: { create: [ValidateNested()] },
  },
  TypeUpsertWithoutItemsInput: {
    fields: { update: [ValidateNested()], create: [ValidateNested()] },
  },

  TypeCreateInput: fieldsValidation,
  TypeCreateManyInput: fieldsValidation,
  TypeUpdateInput: fieldsValidation,
  TypeUpdateManyMutationInput: fieldsValidation,
  TypeCreateWithoutItemsInput: fieldsValidation,
  TypeUpdateWithoutItemsInput: fieldsValidation,
});

@Module({
  imports: [],
  providers: [
    //Queries
    FindManyTypeResolver,
    FindUniqueTypeOrThrowResolver,
    FindFirstTypeOrThrowResolver,
    TypeRelationsResolver,
    AggregateTypeResolver,
    GroupByTypeResolver,
    //Mutations
    CreateOneTypeResolver,
    CreateManyTypeResolver,
    UpdateOneTypeResolver,
    UpdateManyTypeResolver,
    UpsertOneTypeResolver,
    DeleteOneTypeResolver,
    DeleteManyTypeResolver,
  ],
})
export class TypeModule {}
