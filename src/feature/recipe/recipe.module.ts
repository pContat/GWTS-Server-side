import { Module } from '@nestjs/common';
import { ObjectionModule } from '@willsoto/nestjs-objection';
import { RecipeModel } from './model/recipe-model';
import { RecipeDao } from './service/recipe.dao';

@Module({
  imports: [ObjectionModule.forFeature([RecipeModel])],
  providers: [RecipeDao],
  controllers: [],
  exports: [RecipeDao],
})
export class RecipeModule {}
