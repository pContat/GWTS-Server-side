import { GWHttpHelper } from "../helper/gwHttpHelper";

const logPrefix = "DBBuilder";
import { ItemModel } from "../model/item/itemModel";
import { RecipeModel } from "../model/recipe/recipeModel";

//Main that build the batabase
export class DBBuilder {
  itemModel: ItemModel;
  receiptModel: RecipeModel;
  // pseudo cache for now will not work with mutiple update
  insertedRecipes: Map<string, boolean>;
  insertedItems: Map<string, any>;

  constructor() {
    this.insertedRecipes = new Map<string, boolean>();
    this.insertedItems = new Map<string, boolean>();
    this.itemModel = new ItemModel();
    this.receiptModel = new RecipeModel();
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
}
