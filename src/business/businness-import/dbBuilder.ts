import {GWAPI, ItemDAO, ItemDocument, RecipeDocument} from "../../model";
import {httpGWItemToItem} from "./httpGWToModelConverter";
import logger from "../../helper/logger";
import {GWHttpHelper} from "../../helper";
import RecipeModel, {Ingredient} from "../../model/recipe/recipeModel";
import {createRootTree, ingredientsToNodes, Node} from "./recipeTree";
import ReceiptDetail = GWAPI.ReceiptDetail;

export class DBBuilder {
  itemDAO: ItemDAO;
  // warning size
  recipeForItemCache: Map<number, RecipeDocument>;
  private padding = 200;

  constructor() {
    this.recipeForItemCache = new Map<number, RecipeDocument>();
    this.itemDAO = new ItemDAO();
  }

  async importItems() {
    try {
      await this.createRecipeCache();
      const items: any[] = await GWHttpHelper.getAllItemsId();
      logger.info(items.length + " item to insert");
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
        const fromRecipe = new RecipeModel(recipesData);
        this.recipeForItemCache.set(fromRecipe.output_item_id, fromRecipe);
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
    // await the pending request
    await Promise.all(promiseArray);
    // not good att all
    return items.length > 0 ? await functionToCall(items) : Promise.resolve();
  }

  private linkRecipeToItem(item: ItemDocument) {
    const recipeForItem = this.recipeForItemCache.get(item.id);
    if (recipeForItem) {
      recipeForItem.ingredients.forEach((ingredient: Ingredient) => {
        ingredient.isCraftable = !!this.recipeForItemCache.get(ingredient.item_id);
      });
      item.fromRecipe = recipeForItem;
      const recipeTree = this.buildRecipeTree(item);
      item.fromRecipe.tree = JSON.stringify(recipeTree);
      logger.info(item.fromRecipe.tree);

    } else {
      logger.debug('no recipe for item ', item.id);
    }
  }

  // TODO: can use cache to improve creation time : priority low
  private buildRecipeTree(item: ItemDocument): Node<Ingredient> {
    const stack: Node<Ingredient>[] = [];
    const root = createRootTree(item);
    stack.push(root);
    while (stack.length > 0) {
      const currentItem = stack.pop() as Node<Ingredient>; //can't be undefined -> force cast
      for (const ingredientNode of currentItem.children) {
        const recipe = this.recipeForItemCache.get(ingredientNode.data.item_id);
        if (recipe) {
          // const item = await itemDao.model.findOne({id: ingredientNode.data.item_id}) as ItemDocument;
          ingredientNode.children.push(...ingredientsToNodes(recipe));
        }
        stack.push(ingredientNode)
      }
    }
    return root;
  }

}
