import { Module } from '@nestjs/common';
import { GwApiModule } from '../gw-api/gw-api.module';
import { ItemModule } from '../item/item.module';
import { RecipeModule } from '../recipe/recipe.module';
import { ImportService } from './import.service';

@Module({
  imports: [RecipeModule, ItemModule, GwApiModule],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
