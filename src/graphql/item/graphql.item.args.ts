import { ArgsType, Field } from 'type-graphql';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import {
  CreateManyItemArgs,
  CreateOneItemArgs,
  UpdateOneItemArgs,
  UpsertOneItemArgs,
} from '@generated/type-graphql';

@ArgsType()
export class CreateOneItemAndUploadOneImageArgs extends CreateOneItemArgs {
  @Field(() => GraphQLUpload, {
    nullable: true,
    description:
      'Image upload object: when sending a file in the request, it must be filled with null (filled out on the server, check https://github.com/jaydenseric/graphql-multipart-request-spec)',
  })
  uploadImage?: GraphQLUpload;
}

@ArgsType()
export class CreateManyItemAndUploadManyImageArgs extends CreateManyItemArgs {
  @Field(() => [GraphQLUpload], {
    nullable: true,
    description:
      'Image upload objects: when sending files in the request, it must be filled with [null, null] (filled out on the server, check https://github.com/jaydenseric/graphql-multipart-request-spec)',
  })
  uploadImages?: GraphQLUpload[];
}

@ArgsType()
export class UpdateOneItemAndUploadOneImageArgs extends UpdateOneItemArgs {
  @Field(() => GraphQLUpload, {
    nullable: true,
    description:
      'Image upload object: when sending a file in the request, it must be filled with null (filled out on the server, check https://github.com/jaydenseric/graphql-multipart-request-spec)',
  })
  uploadImage?: GraphQLUpload;
  @Field(() => Boolean, {
    nullable: true,
    description:
      'Image deletion flag: cannot be set at the same time as uploadImage',
  })
  deleteImage?: boolean;
}

@ArgsType()
export class UpsertOneItemAndUploadOneImageArgs extends UpsertOneItemArgs {
  @Field(() => GraphQLUpload, {
    nullable: true,
    description:
      'Image upload object: when sending a file in the request, it must be filled with null (filled out on the server, check https://github.com/jaydenseric/graphql-multipart-request-spec)',
  })
  uploadImage?: GraphQLUpload;
  @Field(() => Boolean, {
    nullable: true,
    description:
      'Image deletion flag: cannot be set at the same time as uploadImage',
  })
  deleteImage?: boolean;
}
