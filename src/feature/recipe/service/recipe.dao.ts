import { Inject, Injectable, Logger } from '@nestjs/common';
import { ObjectionCrudDao } from '../../../core/database/services/objection-crud.dao';
import { RecipeModel } from '../model/recipe-model';

@Injectable()
export class RecipeDao extends ObjectionCrudDao<RecipeModel> {
  logger = new Logger(RecipeDao.name);
  constructor(
    @Inject(RecipeModel) private readonly recipeModel: typeof RecipeModel,
  ) {
    super(recipeModel);
  }
}
