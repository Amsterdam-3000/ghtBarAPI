import { Module } from '@nestjs/common';

import { UserModule } from './user/user.module';
import { ItemModule } from './item/item.module';
import { TypeModule } from './type/type.module';
import { CountryModule } from './country/country.module';

@Module({
  imports: [UserModule, CountryModule, TypeModule, ItemModule],
})
export class GraphqlModule {}
