import {GWAPI, ItemDAO, ItemDocument, RecipeDocument} from "../../model";
import {GWApiItemToItem} from "../../lib/gwApi/gwApiToModelConverter";
import logger from "../../lib/logger/logger";
import {getAllItemsId, getAllRecipesId, getItemsDetail, getRecipesDetail, TreeNode} from "../../lib/index";
import RecipeModel, {Ingredient} from "../../model/recipe/recipeModel";
import {createRootTree, recipeToNodes} from "../../lib/recipeTree/ingredientTree";
import ReceiptDetail = GWAPI.ReceiptDetail;

export class DBBuilder {
  itemDAO: ItemDAO;
  // warning size
  recipeForItemCache: Map<number, RecipeDocument>;
  private padding = 200;
  private canBePurchase: Map<number, number>;

  constructor() {
    this.recipeForItemCache = new Map<number, RecipeDocument>();
    this.itemDAO = new ItemDAO();
    this.canBePurchase = this.craftingSupplies();

  }

  async importItems() {
    try {
      await this.createRecipeCache();
      const items: any[] = await getAllItemsId();
      logger.info(items.length + " item to insert");
      return await this.queuedCall(items, this.saveItems.bind(this));
    } catch (e) {
      logger.error(e);
    }
  }

  async createRecipeCache(): Promise<void> {
    try {
      const recipes: any[] = await getAllRecipesId();
      logger.info(recipes.length + " recipe to insert");
      await this.queuedCall(recipes, this.populateRecipeCache.bind(this));
    } catch (e) {
      logger.error(e);
    }
  }

  async populateRecipeCache(recipesIds: number[]) {
    try {
      const recipesData = await getRecipesDetail(recipesIds);
      recipesData.forEach((recipesData: ReceiptDetail) => {
        const fromRecipe = new RecipeModel(recipesData);
        this.recipeForItemCache.set(fromRecipe.output_item_id, fromRecipe);
      });
    } catch (e) {
      logger.error(e.message)
    }
  }

  async saveItems(itemsIds: number[]): Promise<any> {
    try {
      const itemsData = await getItemsDetail(itemsIds);
      const itemDocuments = itemsData.map(GWApiItemToItem).map(this.fixVendorPrice.bind(this));


      itemDocuments.forEach(this.linkRecipeToItem.bind(this));
      return await this.itemDAO.model.insertMany(itemDocuments);
    } catch (e) {
      logger.error(e.message)
    }
  }


  private fixVendorPrice(item: ItemDocument) {

    item.vendor_value = this.canBePurchase.get(item.id) || 0;
    return item;
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
  private buildRecipeTree(item: ItemDocument): TreeNode<Ingredient> {
    const stack: TreeNode<Ingredient>[] = [];
    const root = createRootTree(item);
    stack.push(root);
    while (stack.length > 0) {
      const currentItem = stack.pop() as TreeNode<Ingredient>; //can't be undefined -> force cast
      for (const ingredientNode of currentItem.children) {
        const recipe = this.recipeForItemCache.get(ingredientNode.data.item_id);
        if (recipe) {
          currentItem.data.outputCountIfCraft = recipe.output_item_count;
          // const item = await itemDao.model.findOne({id: ingredientNode.data.item_id}) as ItemDocument;
          ingredientNode.children.push(...recipeToNodes(recipe));
        }
        stack.push(ingredientNode)
      }
    }
    return root;
  }


  // https://wiki.guildwars2.com/wiki/Crafting_Supplier
  // description contain : "can be purchased from master craftsmen"
  private craftingSupplies() {
    return new Map([
      [19704, 8],
      [19750, 16],
      [19924, 48],
      [19792, 8],
      [19789, 16],
      [19794, 24],
      [19793, 32],
      [19791, 48],
      [19790, 64],
      [46747, 149],
      [13010, 496],
      [13006, 1480],
      [13007, 5000],
      [13008, 20000],
      [13009, 100000],
      [12157, 8],
      [12151, 8],
      [12158, 8],
      [12153, 8],
      [12155, 8],
      [12156, 8],
      [12324, 8],
      [12136, 8],
      [12271, 8],
    ]);


  }


  /*
  {id: 19704, name: "Lump of Tin"}
{id: 19750, name: "Lump of Coal"}
{id: 19924, name: "Lump of Primordium"}
{id: 19792, name: "Spool of Jute Thread"}
{id: 19789, name: "Spool of Wool Thread"}
{id: 19794, name: "Spool of Cotton Thread"}
{id: 19793, name: "Spool of Linen Thread"}
{id: 19791, name: "Spool of Silk Thread"}
{id: 19790, name: "Spool of Gossamer Thread"}
{id: 46747, name: "Thermocatalytic Reagent"}
{id: 13010, name: "Minor Rune of Holding"}
{id: 13006, name: "Rune of Holding"}
{id: 13007, name: "Major Minor Rune of Holding"}
{id: 13008, name: "Greater Rune of Holding	"}
{id: 13009, name: "Superior Rune of Holding	"}
{id: 12157, name: "Jar of Vinegar "}
{id: 12151, name: "Packet of Baking Powder "}
{id: 12158, name: "Jar of Vegetable Oil "}
{id: 12153, name: "Packet of Salt "}
{id: 12155, name: "Bag of Sugar "}
{id: 12156, name: "Jug of Water "}
{id: 12324, name: "Bag of Starch "}
{id: 12136, name: "Bag of Flour "}
{id: 12271, name: "Bottle of Soy Sauce "}
   */

}
