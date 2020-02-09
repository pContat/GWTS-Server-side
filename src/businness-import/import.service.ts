import { Injectable, Logger } from '@nestjs/common';
import { buildRecipeTree } from '../business-receipt/ingredient-tree';
import { ItemDao } from '../common/service/item.dao';
import { GWApiService } from '../gw-api/gw-http-api.service';
import ReceiptDetail = GWAPI.RecipeDetail;
import { GWAPI } from '../gw-api/gw-api-type';
import { toItem, toRecipe } from './gw-api-converter';
import { Ingredient, Item, Recipe } from '../common/type';
import { BaseModel } from 'src/database/models/base.model';
import { RecipeDao } from '../common/service/recipe.dao';
import { isNil, chunk } from 'lodash';
import {AsyncFunction, AsyncUtils} from "../core/utils";

@Injectable()
export class ImportService {
  // warning size
  private padding = 200;
  private canBePurchase: Map<number, number>;
  recipeForItemCache: Map<number, Recipe>;
  logger = new Logger(ImportService.name);

  constructor(
    private readonly itemDao: ItemDao,
    private readonly recipeDao: RecipeDao,
    private readonly gwApiService: GWApiService,
  ) {
    this.recipeForItemCache = new Map();
    this.canBePurchase = this.craftingSupplies();
  }

  async importItems() {
    this.logger.log('start import');
    try {
      await this.createRecipeCache();
      this.logger.log('recipe cache created');
      const items = await this.gwApiService.getAllItemsId();
      this.logger.log(`${items.length} item to insert`);
      await this.queuedCall(items, this.saveItems.bind(this));
    } catch (e) {
      this.logger.error(e);
    }
  }

  async requiredImport() {
    return await this.itemDao.isEmpty();
  }

  private async createRecipeCache(): Promise<void> {
    try {
      const recipes = await this.gwApiService.getAllRecipesId();
      this.logger.log(`${recipes.length} recipe to insert`);
      await this.queuedCall(recipes, this.populateRecipeCache.bind(this));
    } catch (e) {
      this.logger.error(e);
      throw new Error('Unable to create recipe cache');
    }
  }

  private async populateRecipeCache(recipesIds: number[]) {
    const recipesData = await this.gwApiService.getRecipesDetail(recipesIds);
    recipesData.forEach((recipesData: ReceiptDetail) => {
      // warning check here
      const fromRecipe = toRecipe(recipesData);
      this.recipeForItemCache.set(fromRecipe.outputItemId, fromRecipe);
    });
  }

  private async saveItems(itemsIds: number[]): Promise<any> {
    const itemsData = await this.gwApiService.getItemsDetail(itemsIds);
    const itemDocuments: Item[] = itemsData
      .map(item => toItem(item))
      .map(item => this.fixVendorPrice(item));

    const recipeList = itemDocuments
      .map(item => this.linkRecipeToItem(item))
      .filter(el => !isNil(el));

    try {
      await this.recipeDao.bulkInsert(recipeList );
      await this.itemDao.bulkInsert(itemDocuments);
      this.logger.log(`save recipe : ${recipeList.length}, item ${itemDocuments.length}`)
    } catch (err) {
      this.logger.error('Something went wrong during insert', err);
      throw new Error(err);
    }
  }

  private fixVendorPrice(item: Item) {
    item.vendorValue = this.canBePurchase.get(item.id) || 0;
    return item;
  }

  // warning alter input
  private linkRecipeToItem(item: Item): Recipe | null {
    const recipeForItem = this.recipeForItemCache.get(item.id);
    if (recipeForItem) {
      item.fromRecipeId = recipeForItem.id;

      recipeForItem.ingredients.forEach((ingredient: Ingredient) => {
        ingredient.isCraftable = !!this.recipeForItemCache.get(
          ingredient.itemId,
        );
      });
      const recipeTree = buildRecipeTree(
        recipeForItem,
        this.recipeForItemCache,
      );
      // JSON.stringify(recipeTree);
      recipeForItem.craftingTree = recipeTree;
      return recipeForItem;
    } else {
      //this.logger.log(`no recipe for item ${item.id}`);
    }
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

  private async queuedCall(items: any[], functionToCall: AsyncFunction) {
    // create array of 200 parames
    const chunkedParam = chunk(items, this.padding);
    return AsyncUtils.parallelBatch(chunkedParam,functionToCall,20)
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
