import { ArgsType, Field } from 'type-graphql';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';

import {
  CreateOneItemArgs,
  CreateManyItemArgs,
  UpdateOneItemArgs,
  UpsertOneItemArgs,
} from '@generated/type-graphql';

@ArgsType()
export class CreateOneItemAndUploadOneImageArgs extends CreateOneItemArgs {
  @Field(() => GraphQLUpload, { nullable: true })
  uploadImage?: GraphQLUpload;
}

@ArgsType()
export class CreateManyItemAndUploadManyImageArgs extends CreateManyItemArgs {
  @Field(() => [GraphQLUpload], { nullable: true })
  uploadImages?: GraphQLUpload[];
}

@ArgsType()
export class UpdateOneItemAndUploadOneImageArgs extends UpdateOneItemArgs {
  @Field(() => GraphQLUpload, { nullable: true })
  uploadImage?: GraphQLUpload;
  @Field(() => Boolean, { nullable: true })
  deleteImage?: boolean;
}

@ArgsType()
export class UpsertOneItemAndUploadOneImageArgs extends UpsertOneItemArgs {
  @Field(() => GraphQLUpload, { nullable: true })
  uploadImage?: GraphQLUpload;
  @Field(() => Boolean, { nullable: true })
  deleteImage?: boolean;
}
