import {Controller, Get, Header, Param} from "@nestjs/common";
import {ItemDao} from "../common/service/item.dao";
import {RecipeDao} from "../common/service/recipe.dao";
import {printRecipeTree} from "../business-receipt/print-tree";

@Controller("/")
export class SearchController {
    constructor(private readonly itemDao : ItemDao, private readonly recipeDao : RecipeDao) {}

    @Get("item/:id/tree")
    @Header('content-type', 'text/plain; charset=utf-8')
    async getItemTree(@Param('id') id): Promise<string> {
        const item = await this.itemDao.findById(id, { relationExpression : "fromRecipe"});
         const test = printRecipeTree(item.fromRecipe.craftingTree);
         console.log(test);
         return test;
    }
}
