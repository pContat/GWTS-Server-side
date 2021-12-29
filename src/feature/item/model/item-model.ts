import { Model } from 'objection';
import { RecipeModel } from '../../recipe/model/recipe-model';
import { BaseModel } from '../../../core/database/models/base.model';

export class ItemModel extends BaseModel {
  static tableName = 't_e_item';

  readonly id: number;

  //If the item is the result of a receipt
  fromRecipeId?: number;
  fromRecipe?: RecipeModel;

  type: string; //Armor / Weapon / etc
  name: string;
  iconUrl?: string;
  level: number;
  rarity: string;
  flags: string[];
  chatLink: string;
  vendorValue: number;

  //top = false;
  //demand = false;

  static get relationMappings() {
    return {
      fromRecipe: {
        relation: Model.HasOneRelation,
        modelClass: RecipeModel,
        join: {
          from: `${ItemModel.tableName}.from_recipe_id`,
          to: `${RecipeModel.tableName}.${RecipeModel.idColumn}`,
        },
      },
    };
  }
}
