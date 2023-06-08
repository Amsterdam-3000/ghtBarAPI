import { Module } from '@nestjs/common';
import { Authorized } from 'type-graphql';
import {
  IsEmpty,
  IsNotEmpty,
  IsNumber,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

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
} from './item.resolver';

applyResolversEnhanceMap({
  Item: {
    // createOneItem: [Authorized('ADMIN')],
    // createManyItem: [Authorized('ADMIN')],
    // deleteOneItem: [Authorized('ADMIN')],
    // deleteManyItem: [Authorized('ADMIN')],
    // updateOneItem: [Authorized('ADMIN')],
    // upsertOneItem: [Authorized('ADMIN')],
    updateManyItem: [Authorized('ADMIN')],
  },
});

applyModelsEnhanceMap({
  User: {
    fields: {
      createdAt: [Authorized('ADMIN')],
      updatedAt: [Authorized('ADMIN')],
    },
  },
});

applyArgsTypesEnhanceMap({
  CreateOneItemArgs: {
    fields: {
      data: [ValidateNested({ message: '1', context: { error: '2' } })],
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
    imageId: [IsEmpty()],
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
    // CreateOneItemResolver,
    // CreateManyItemResolver,
    // UpdateOneItemResolver,
    UpdateManyItemResolver,
    // UpsertOneItemResolver,
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
export class ItemModule {}
