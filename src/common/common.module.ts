import { Module} from '@nestjs/common';
import {ItemDao} from "./service/item.dao";
import {RecipeDao} from "./service/recipe.dao";

@Module({
  imports: [],
  providers: [ItemDao,RecipeDao],
  exports : [ItemDao,RecipeDao]
})
export class CommonModule {}
