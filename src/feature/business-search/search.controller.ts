import { Controller, Get, Header, Param } from '@nestjs/common';
import { printRecipeTree } from '../recipe/print-tree';
import { ItemDao } from '../item/service/item.dao';
import { RecipeDao } from '../recipe/service/recipe.dao';

@Controller('/')
export class SearchController {
  constructor(
    private readonly itemDao: ItemDao,
    private readonly recipeDao: RecipeDao,
  ) {}

  @Get('item/:id/tree')
  @Header('content-type', 'text/plain; charset=utf-8')
  async getItemTree(@Param('id') id): Promise<string> {
    const item = await this.itemDao.findById(id, {
      relationExpression: 'fromRecipe',
    });
    const test = printRecipeTree(item.fromRecipe.craftingTree);
    console.log(test);
    return test;
  }
}
