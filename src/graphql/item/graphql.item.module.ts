import { Authorized } from 'type-graphql';
import {
  IsNotEmpty,
  IsNumber,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Module } from '@nestjs/common';
import {
  AggregateItemResolver,
  applyArgsTypesEnhanceMap,
  applyInputTypesEnhanceMap,
  applyModelsEnhanceMap,
  applyResolversEnhanceMap,
  DeleteManyItemResolver,
  DeleteOneItemResolver,
  FindFirstItemOrThrowResolver,
  FindManyItemResolver,
  FindUniqueItemOrThrowResolver,
  GroupByItemResolver,
  ItemRelationsResolver,
  UpdateManyItemResolver,
} from '@generated/type-graphql';

import {
  ComputeFieldsItemResolver,
  CreateManyItemAndUploadManyImageResolver,
  CreateOneItemAndUploadOneImageResolver,
  UpdateOneItemAndUploadOneImageResolver,
  UpsertOneItemAndUploadOneImageResolver,
} from './graphql.item.resolver';

applyResolversEnhanceMap({
  Item: {
    createOneItem: [Authorized('ADMIN')],
    createManyItem: [Authorized('ADMIN')],
    deleteOneItem: [Authorized('ADMIN')],
    deleteManyItem: [Authorized('ADMIN')],
    updateOneItem: [Authorized('ADMIN')],
    upsertOneItem: [Authorized('ADMIN')],
    updateManyItem: [Authorized('ADMIN')],
  },
});

applyModelsEnhanceMap({
  Item: {
    fields: {
      createdAt: [Authorized('ADMIN')],
      updatedAt: [Authorized('ADMIN')],
    },
  },
});

applyArgsTypesEnhanceMap({
  CreateOneItemArgs: {
    fields: {
      data: [ValidateNested()],
    },
  },
  CreateManyItemArgs: { fields: { data: [ValidateNested()] } },
  UpdateOneItemArgs: { fields: { data: [ValidateNested()] } },
  UpdateManyItemArgs: { fields: { data: [ValidateNested()] } },
  UpsertOneItemArgs: {
    fields: { create: [ValidateNested()], update: [ValidateNested()] },
  },
});

const fieldsValidation = {
  fields: {
    name: [IsNotEmpty()],
    strength: [IsNumber({ maxDecimalPlaces: 1 }), Min(0), Max(100)],
  },
};

const fieldsNestedValidation = {
  fields: {
    ...fieldsValidation.fields,
    user: [ValidateNested()],
    type: [ValidateNested()],
    country: [ValidateNested()],
  },
};

applyInputTypesEnhanceMap({
  ItemCreateInput: fieldsNestedValidation,
  ItemCreateManyInput: fieldsValidation,
  ItemUpdateInput: fieldsNestedValidation,
  ItemUpdateManyMutationInput: fieldsValidation,
});

@Module({
  providers: [
    //Queries
    FindManyItemResolver,
    FindUniqueItemOrThrowResolver,
    FindFirstItemOrThrowResolver,
    ItemRelationsResolver,
    AggregateItemResolver,
    GroupByItemResolver,
    //Mutations
    UpdateManyItemResolver,
    DeleteOneItemResolver,
    DeleteManyItemResolver,
    //Computed Fields
    ComputeFieldsItemResolver,
    //Custom Mutations
    CreateOneItemAndUploadOneImageResolver,
    CreateManyItemAndUploadManyImageResolver,
    UpdateOneItemAndUploadOneImageResolver,
    UpsertOneItemAndUploadOneImageResolver,
  ],
})
export class GraphqlItemModule {}
