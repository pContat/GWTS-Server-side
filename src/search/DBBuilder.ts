import * as requestPromiseNative from "request-promise-native";
import * as console from "console";

import { error } from "util";
import { GWHttpHelper } from "../helper/gwHttpHelper";

import * as mongoose from "mongoose";
const logPrefix = "DBBuilder";
import { ItemModel } from "../model/item/itemModel";
import { ItemType, default as Item } from "../model/item/itemSchema";
import { RecipeModel } from "../model/recipe/recipeModel";
import { RecipeType, default as Recipe } from "../model/recipe/recipeSchema";

//Main that build the batabase
export class DBBuilder {
  itemModel: ItemModel;
  receiptModel: RecipeModel;
  // pseudo cache for now will not work with mutiple update
  insertedRecipes: Map<string, boolean>;
  insertedItems: Map<string, any>;

  private padding = 200;
  constructor() {
    this.insertedRecipes = new Map<string, boolean>();
    this.insertedItems = new Map<string, boolean>();
    this.itemModel = new ItemModel();
    this.receiptModel = new RecipeModel();
  }

  async test() {
    try {
      const items: any[] = await GWHttpHelper.items();
      const promiseArray: any[] = [];
      console.log(items.length + " item to insert");
      //const items: any[] = [1, 2, 6];
      while (items.length > this.padding) {
        promiseArray.push(this.saveItems(items.splice(0, this.padding)));
        // prevent 429 too many request
        if (promiseArray.length > 40) {
          await Promise.all(promiseArray);
          promiseArray.length = 0;
        }
      }
      return items.length > 0 ? this.saveItems(items) : Promise.resolve();
    } catch (e) {
      console.log(e);
    }
  }

  async insertRecipe() {
    try {
      const recipes: any[] = await GWHttpHelper.recipes();
      const promiseArray: any[] = [];
      console.log(recipes.length + " recipe to insert");
      while (recipes.length > this.padding) {
        promiseArray.push(this.saveRecipes(recipes.splice(0, this.padding)));
        // prevent 429 too many request
        if (promiseArray.length > 40) {
          await Promise.all(promiseArray);
          promiseArray.length = 0;
        }
      }
      return recipes.length > 0 ? this.saveRecipes(recipes) : Promise.resolve();
    } catch (e) {
      console.log(e);
    }
  }

  async saveRecipes(recipesIds: string[]): Promise<any> {
    const recipesData = await GWHttpHelper.recipesDetail(recipesIds);

    const itemDocument = recipesData.map(async (recipesData: any) => {
      // get item from output
      const item = await this.itemModel.get({ id: recipesData.output_item_id });
      item.receipt = new Recipe(recipesData);

      // new item as itemTypes
      return new Item(recipesData);
    });
    return this.itemModel.getModel().insertMany(itemDocument);
  }

  async saveItems(itemsIds: string[]): Promise<any> {
    const itemsData = await GWHttpHelper.itemsDetail(itemsIds);

    const itemDocument = itemsData.map((itemData: any) => {
      itemData.receipt = [];
      if (!itemData.name) {
        console.log(itemData.id);
      }
      // new item as itemTypes
      return new Item(itemData);
    });
    return this.itemModel.getModel().insertMany(itemDocument);
  }
}
