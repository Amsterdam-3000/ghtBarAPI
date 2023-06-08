import {
  Args,
  Ctx,
  FieldResolver,
  Info,
  Mutation,
  Resolver,
  Root,
} from 'type-graphql';
import {
  CreateOneItemResolver,
  CreateManyItemResolver,
  Item,
  UpdateOneItemResolver,
  UpsertOneItemResolver,
  AffectedRowsOutput,
} from '@generated/type-graphql';

import {
  CreateOneItemAndUploadOneImageArgs,
  CreateManyItemAndUploadManyImageArgs,
  UpdateOneItemAndUploadOneImageArgs,
  UpsertOneItemAndUploadOneImageArgs,
} from './item.args';
import { ItemImage } from './item.type';

@Resolver(() => Item)
export class ComputeFieldsItemResolver {
  @FieldResolver(() => ItemImage, { nullable: true })
  image(@Root() item) {
    return item.image;
  }
}

//TODO Can be removed? We just need to add new fields to Arguments
@Resolver()
export class CreateOneItemAndUploadOneImageResolver extends CreateOneItemResolver {
  // @Authorized('ADMIN')
  @Mutation(() => Item, { nullable: false })
  async createOneItem(
    @Ctx() ctx,
    @Info() info,
    @Args() args: CreateOneItemAndUploadOneImageArgs,
  ): Promise<Item> {
    return await super.createOneItem(ctx, info, args);
  }
}

@Resolver()
export class CreateManyItemAndUploadManyImageResolver extends CreateManyItemResolver {
  // @Authorized('ADMIN')
  @Mutation(() => AffectedRowsOutput, { nullable: false })
  async createManyItem(
    @Ctx() ctx,
    @Info() info,
    @Args() args: CreateManyItemAndUploadManyImageArgs,
  ): Promise<AffectedRowsOutput> {
    return await super.createManyItem(ctx, info, args);
  }
}

@Resolver()
export class UpdateOneItemAndUploadOneImageResolver extends UpdateOneItemResolver {
  // @Authorized('ADMIN')
  @Mutation(() => Item, { nullable: false })
  async updateOneItem(
    @Ctx() ctx,
    @Info() info,
    @Args() args: UpdateOneItemAndUploadOneImageArgs,
  ): Promise<Item> {
    return await super.updateOneItem(ctx, info, args);
  }
}

@Resolver()
export class UpsertOneItemAndUploadOneImageResolver extends UpsertOneItemResolver {
  // @Authorized('ADMIN')
  @Mutation(() => Item, { nullable: false })
  async upsertOneItem(
    @Ctx() ctx,
    @Info() info,
    @Args() args: UpsertOneItemAndUploadOneImageArgs,
  ): Promise<Item> {
    return await super.upsertOneItem(ctx, info, args);
  }
}
