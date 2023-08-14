import { GraphQLResolveInfo } from 'graphql/type';
import {
  Args,
  Authorized,
  Ctx,
  FieldResolver,
  Info,
  Mutation,
  Resolver,
  Root,
} from 'type-graphql';
import {
  AffectedRowsOutput,
  CreateManyItemResolver,
  CreateOneItemResolver,
  Item,
  UpdateOneItemResolver,
  UpsertOneItemResolver,
} from '@generated/type-graphql';

import {
  CreateManyItemAndUploadManyImageArgs,
  CreateOneItemAndUploadOneImageArgs,
  UpdateOneItemAndUploadOneImageArgs,
  UpsertOneItemAndUploadOneImageArgs,
} from './graphql.item.args';
import { ItemImage } from './graphql.item.type';
import { IAppContext } from '../../app/app.model';

@Resolver(() => Item)
export class ComputeFieldsItemResolver {
  @FieldResolver(() => ItemImage, { nullable: true })
  image(@Root() item: Item & { image: ItemImage }): ItemImage {
    return item.image;
  }
}

//TODO Can be removed? We just need to add new fields to Arguments
@Resolver()
export class CreateOneItemAndUploadOneImageResolver extends CreateOneItemResolver {
  @Authorized('ADMIN')
  @Mutation(() => Item, { nullable: false })
  async createOneItem(
    @Ctx() ctx: IAppContext,
    @Info() info: GraphQLResolveInfo,
    @Args() args: CreateOneItemAndUploadOneImageArgs,
  ): Promise<Item> {
    if (args.hasOwnProperty('uploadImage')) {
      args.uploadImage = await args.uploadImage;
    }
    return await super.createOneItem(ctx, info, args);
  }
}

@Resolver()
export class CreateManyItemAndUploadManyImageResolver extends CreateManyItemResolver {
  @Authorized('ADMIN')
  @Mutation(() => AffectedRowsOutput, { nullable: false })
  async createManyItem(
    @Ctx() ctx: IAppContext,
    @Info() info: GraphQLResolveInfo,
    @Args() args: CreateManyItemAndUploadManyImageArgs,
  ): Promise<AffectedRowsOutput> {
    if (args.hasOwnProperty('uploadImages')) {
      args.uploadImages = await Promise.all(args.uploadImages);
    }
    return await super.createManyItem(ctx, info, args);
  }
}

@Resolver()
export class UpdateOneItemAndUploadOneImageResolver extends UpdateOneItemResolver {
  @Authorized('ADMIN')
  @Mutation(() => Item, { nullable: false })
  async updateOneItem(
    @Ctx() ctx: IAppContext,
    @Info() info: GraphQLResolveInfo,
    @Args() args: UpdateOneItemAndUploadOneImageArgs,
  ): Promise<Item> {
    if (args.hasOwnProperty('uploadImage')) {
      args.uploadImage = await args.uploadImage;
    }
    return await super.updateOneItem(ctx, info, args);
  }
}

@Resolver()
export class UpsertOneItemAndUploadOneImageResolver extends UpsertOneItemResolver {
  @Authorized('ADMIN')
  @Mutation(() => Item, { nullable: false })
  async upsertOneItem(
    @Ctx() ctx: IAppContext,
    @Info() info: GraphQLResolveInfo,
    @Args() args: UpsertOneItemAndUploadOneImageArgs,
  ): Promise<Item> {
    if (args.hasOwnProperty('uploadImage')) {
      args.uploadImage = await args.uploadImage;
    }
    return await super.upsertOneItem(ctx, info, args);
  }
}
