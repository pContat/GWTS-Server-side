import {BaseModel} from "../../database/models/base.model";
import {TreeNode} from "../../business-receipt/type";
import {Ingredient} from "../type";
import {StringUtils} from "../../core/utils";

export class RecipeModel extends BaseModel {
  static tableName = 't_e_recipe';

  readonly id: number;
/*  ingredients: [
      {
        item_id: {type: Number},
        count: {
          type: Number
        },
        isCraftable: {
          type: Boolean,
          default: false
        },
        tree: {type: String},
        id: {type: Number},
        type: {type: String},
        chat_link: {type: String}
      }]*/
  outputItemId: number;
  ingredients : Ingredient[];
  disciplines: string[];
  outputItemCount: number;
  type: string;
  chatLink: string;
  // all the receipt to craft this object
  craftingTree: TreeNode<Ingredient>; // co



  $formatDatabaseJson(json: object) {
    //postrgres : due to incompatibility between native array and json types, when setting an array (or a value that could be an array) as the value of a json or jsonb column, you should use JSON.stringify()
    StringUtils.stringify(json, 'ingredients');
    json = super.$formatDatabaseJson(json) as any;
    return json;
  }

}


