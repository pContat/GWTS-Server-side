import {ItemDAO, ItemDocument, RecipeDAO, RecipeDocument} from "../../model";
import {httpGWItemToItem} from "./httpGWToModelConverter";
import logger from "../../helper/logger";
import {GWHttpHelper} from "../../helper";
import RecipeModel from "../../model/recipe/recipeModel";
import {ReceiptDetail} from "../../model/httpGWApi";


const logPrefix = "DBBuilder";

export class DBBuilder {
  itemDAO: ItemDAO;
  recipeDAO: RecipeDAO;
  // warning size
  recipeFromCache: Map<number, RecipeDocument>;

  private padding = 200;

  constructor() {
    this.recipeFromCache = new Map<number, RecipeDocument>();
    this.itemDAO = new ItemDAO();
    this.recipeDAO = new RecipeDAO();
  }


  async importItems() {
    try {
      await this.createRecipeCache();
      const items: any[] = await GWHttpHelper.getAllItemsId();
      logger.info(items.length + " item to insert");
      //const getAllItemsId: any[] = [1, 2, 6];
      return await this.queuedCall(items, this.saveItems.bind(this));
    } catch (e) {
      logger.error(e);
    }
  }

  async createRecipeCache(): Promise<void> {
    try {
      const recipes: any[] = await GWHttpHelper.getAllRecipesId();
      logger.info(recipes.length + " recipe to insert");
      await this.queuedCall(recipes, this.populateRecipeCache.bind(this));
    } catch (e) {
      logger.error(e);
    }
  }

  async populateRecipeCache(recipesIds: string[]) {
    try {
      const recipesData = await GWHttpHelper.recipesDetail(recipesIds);
      recipesData.forEach((recipesData: ReceiptDetail) => {
        const fromReceipt = new RecipeModel(recipesData);
        this.recipeFromCache.set(recipesData.output_item_id, fromReceipt);
      });
    } catch (e) {
      logger.error(e.message)
    }
  }

  async saveItems(itemsIds: string[]): Promise<any> {
    try {
      const itemsData = await GWHttpHelper.itemsDetail(itemsIds);
      const itemDocuments = itemsData.map(httpGWItemToItem);
      itemDocuments.forEach(this.linkRecipeToItem.bind(this));
      return await this.itemDAO.model.insertMany(itemDocuments);
    } catch (e) {
      logger.error(e.message)
    }
  }


  private async queuedCall(items: any[], functionToCall: Function) {
    const promiseArray: any[] = [];
    while (items.length > this.padding) {
      promiseArray.push(functionToCall(items.splice(0, this.padding)));
      // prevent 429 too many request
      if (promiseArray.length > 40) {
        await Promise.all(promiseArray);
        promiseArray.length = 0;
      }
    }
    return items.length > 0 ? await this.saveItems(items) : Promise.resolve();
  }

  private linkRecipeToItem(item: ItemDocument) {
    const recipeForItem = this.recipeFromCache.get(item.id);
    if (recipeForItem) {
      item.fromReceipt = recipeForItem;
    } else {
      logger.debug('no recipe for item ', item.id);
    }
  }
}
