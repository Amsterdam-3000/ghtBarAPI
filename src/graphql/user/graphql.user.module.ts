import { Authorized } from 'type-graphql';
import {
  IsEmail,
  IsEmpty,
  IsStrongPassword,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Module } from '@nestjs/common';
import {
  AggregateUserResolver,
  applyArgsTypesEnhanceMap,
  applyInputTypesEnhanceMap,
  applyModelsEnhanceMap,
  applyResolversEnhanceMap,
  CreateOneUserResolver,
  DeleteManyUserResolver,
  DeleteOneUserResolver,
  FindFirstUserOrThrowResolver,
  FindManyUserResolver,
  FindUniqueUserOrThrowResolver,
  GroupByUserResolver,
  UpdateManyUserResolver,
  UpdateOneUserResolver,
  UserRelationsResolver,
} from '@generated/type-graphql';

applyResolversEnhanceMap({
  User: {
    deleteManyUser: [Authorized('ADMIN')],
    updateManyUser: [Authorized('ADMIN')],
    deleteOneUser: [Authorized(['ADMIN', 'USER'])],
    updateOneUser: [Authorized(['ADMIN', 'USER'])],
    createOneUser: [Authorized('AGENT_USER')],
  },
});

applyModelsEnhanceMap({
  User: {
    fields: {
      email: [Authorized(['ADMIN', 'USER'])],
      createdAt: [Authorized('ADMIN')],
      updatedAt: [Authorized('ADMIN')],
    },
  },
});

applyArgsTypesEnhanceMap({
  CreateOneUserArgs: { fields: { data: [ValidateNested()] } },
  UpdateOneUserArgs: { fields: { data: [ValidateNested()] } },
  UpdateManyUserArgs: { fields: { data: [ValidateNested()] } },
});

const fieldsValidation = {
  fields: {
    name: [Matches(/^\w{4,20}$/)],
    email: [IsEmail()],
    password: [IsStrongPassword()],
  },
};

//TODO Delete these validations (TypeGraphQL Prisma plugin should do it)
applyInputTypesEnhanceMap({
  UserCreateNestedOneWithoutItemsInput: {
    fields: { create: [IsEmpty()], connectOrCreate: [IsEmpty()] },
  },
  UserUpdateOneWithoutItemsNestedInput: {
    fields: {
      create: [IsEmpty()],
      connectOrCreate: [IsEmpty()],
      update: [IsEmpty()],
      upsert: [IsEmpty()],
      delete: [IsEmpty()],
    },
  },
  UserUpdateToOneWithWhereWithoutItemsInput: {
    fields: {
      data: [IsEmpty()],
    },
  },
  UserCreateInput: fieldsValidation,
  UserUpdateInput: fieldsValidation,
  UserUpdateManyMutationInput: fieldsValidation,
});

@Module({
  imports: [],
  providers: [
    //Queries
    FindManyUserResolver,
    FindUniqueUserOrThrowResolver,
    FindFirstUserOrThrowResolver,
    UserRelationsResolver,
    AggregateUserResolver,
    GroupByUserResolver,
    //Mutations
    CreateOneUserResolver,
    UpdateOneUserResolver,
    UpdateManyUserResolver,
    DeleteOneUserResolver,
    DeleteManyUserResolver,
  ],
})
export class GraphqlUserModule {}
