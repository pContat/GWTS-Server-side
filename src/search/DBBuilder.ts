import * as requestPromiseNative from "request-promise-native";
import * as console from "console";

import { error } from "util";
import { GWHttpHelper } from "../helper/gwHttpHelper";

import * as mongoose from "mongoose";
const logPrefix = "DBBuilder";
import { ItemModel } from "../model/item/itemModel";
import { ItemType, default as Item } from "../model/item/itemSchema";
import { RecipeModel } from "../model/recipe/recipeModel";

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
  async crawl() {
    try {
      // const recipes = await GWHttpHelper.allRecipe();
      // console.log(recipes.length + "receipt to insert");
      const recipes = [1, 3, 5];
      const promiseArray = recipes.map(this.saveRecipe.bind(this));
      return Promise.all(promiseArray);
    } catch (err) {
      console.log(err);
    }
  }

  async saveRecipe(recipeId: string) {
    if (!this.insertedRecipes.get(recipeId)) {
      const detail = await GWHttpHelper.recipeDetail(recipeId);

      let recipeData: any = {};
      recipeData.output_item_id = detail.output_item_id;
      recipeData.recipe_id = recipeId;

      const ingredients = await this.saveIngredients(detail.ingredients);

      recipeData.ingredients = ingredients;
      await this.receiptModel.save(recipeData);
      this.insertedRecipes.set(recipeId, true);
    }
    return true;
  }

  //Get info for item and save then into the database
  //resollve ingredient object
  saveIngredients(ingredients: string[]) {
    return Promise.all(ingredients.map(this.saveOneIngredient.bind(this)));
  }

  //get info from GW2 APi and retrieve or insert the item
  async saveOneIngredient(componentObject: any) {
    if (!this.insertedItems.get(componentObject.item_id)) {
      await this.saveItem(componentObject.item_id);
      const iDontRemeenber = {
        item: componentObject.item_id,
        quantity: componentObject.count
      };
      this.insertedItems.set(componentObject.item_id, iDontRemeenber);
      return Promise.resolve(iDontRemeenber);
    }
  }

  async saveItem(itemId: string) {
    const itemData = await GWHttpHelper.itemDetail(itemId);

    return this.itemModel.saveItem(itemData);
  }

  async saveItems(itemsIds: string[]): Promise<any> {
    const itemsData = await GWHttpHelper.itemsDetail(itemsIds);
    const test = (error: any, doc: any) => {
      console.log(error);
      console.log(doc.length);
    };
    const itemDocument = itemsData.map((itemData: any) => {
      itemData.receipt = [];
      return new Item(itemData);
    });
    return this.itemModel.getModel().insertMany(itemDocument);

    // Item.insertMany(itemsData, test);
    // setTimeout(() => Promise.resolve(), 2000);
    // .then(function(mongooseDocuments) {
    //   return Promise.resolve();
    // })
    // .catch(function(err) {
    //   return Promise.reject(err);
    // });
  }
}
