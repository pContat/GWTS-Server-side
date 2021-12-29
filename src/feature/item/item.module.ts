import { Module } from '@nestjs/common';
import { ObjectionModule } from '@willsoto/nestjs-objection';
import { ItemModel } from './model/item-model';
import { ItemDao } from './service/item.dao';

@Module({
  imports: [ObjectionModule.forFeature([ItemModel])],
  providers: [ItemDao],

  exports: [ItemDao],
})
export class ItemModule {}
