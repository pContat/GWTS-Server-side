import { BaseModel } from '../../database/models/base.model';
import { RecipeModel } from './recipe-model';
import { Model } from 'objection';
import { Ingredient } from '../type';

export class ItemModel extends BaseModel {
  static tableName = 't_e_item';

  // Table Name is the only required property.

  readonly id: number;

  //If the item is the result of a receipt
  fromRecipeId?: number;
  fromRecipe?: RecipeModel;
  //Armor / Weapon / etc
  type: string;
  name: string;
  iconUrl?: string;
  level: number;
  rarity: string;
  flags: string[];
  chatLink: string;
  vendorValue: number;

  //top = false;
  //demande = false;

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
