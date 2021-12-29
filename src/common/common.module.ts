import { Module } from '@nestjs/common';
import { ObjectionModule } from '@willsoto/nestjs-objection';
import { ItemModel } from './model/item-model';
import { RecipeModel } from './model/recipe-model';
import { ItemDao } from './service/item.dao';
import { RecipeDao } from './service/recipe.dao';

@Module({
  imports: [ObjectionModule.forFeature([ItemModel, RecipeModel])],
  providers: [ItemDao, RecipeDao],
  exports: [ItemDao, RecipeDao],
})
export class CommonModule {}
