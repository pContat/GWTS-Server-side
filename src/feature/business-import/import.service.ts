import { Inject, Injectable, Logger } from '@nestjs/common';
import { chunk, isNil } from 'lodash';
import { AsyncFunction, AsyncUtils } from '../../common/utils';
import { FileStorageInterface } from '../../core/storage/file-storage.interface';
import { apiStorage } from '../../core/storage/storage-provider';
import { craftingSupplies } from '../business-search/conf/deal-critera';
import { GuildWarsAPI } from '../gw-api/gw-api-type';
import { GWApiService } from '../gw-api/gw-http-api.service';
import { ItemDao } from '../item/service/item.dao';
import { Ingredient, Item } from '../item/type/type';
import { buildRecipeTree } from '../recipe/ingredient-tree';
import { RecipeDao } from '../recipe/service/recipe.dao';
import { Recipe } from '../recipe/type/recipe';
import { toItem, toRecipe } from './gw-api-converter';
import ReceiptDetail = GuildWarsAPI.RecipeDetail;

@Injectable()
export class ImportService {
  // warning size
  private padding = 100;
  private canBePurchase: Map<number, number>;
  recipeForItemCache: Map<number, Recipe>;
  logger = new Logger(ImportService.name);

  constructor(
    private readonly itemDao: ItemDao,
    private readonly recipeDao: RecipeDao,
    private readonly gwApiService: GWApiService,
    @Inject(apiStorage) readonly storageService: FileStorageInterface,
  ) {
    this.recipeForItemCache = new Map();
    this.canBePurchase = craftingSupplies;
  }

  async importItems() {
    this.logger.log('start Guild Wars DB import');
    try {
      await this.createRecipeCache();
      this.logger.log('recipe cache created');
      const items = await this.gwApiService.getAllItemsId();
      this.logger.log(`${items.length} item to insert`);
      await this.queuedCall(items, itemsIds => this.saveItems(itemsIds));
    } catch (e) {
      this.logger.error(e);
    }
  }

  async requiredImport() {
    return await this.itemDao.isEmpty();
  }

  private async createRecipeCache(): Promise<void> {
    try {
      const cacheName = 'recipe-cache.json';
      if (await this.storageService.doesFileExist(cacheName)) {
        this.logger.log('cache detected, start loading');
        const content = JSON.parse(
          await this.storageService.getFileContent(cacheName),
        ) as Record<string, Recipe>;
        this.recipeForItemCache = new Map(
          Object.keys(content).map(key => [+key, content[key]]),
        );
      } else {
        const recipes = await this.gwApiService.getAllRecipesId();
        this.logger.log(`${recipes.length} recipe to insert`);
        await this.queuedCall(recipes, recipeIds =>
          this.populateRecipeCache(recipeIds),
        );
        await this.storageService.saveFile(
          'recipe-cache.json',
          Buffer.from(
            JSON.stringify(Object.fromEntries(this.recipeForItemCache)),
          ),
          { isPublic: true },
        );
      }
      this.logger.log(`recipe cache dumped`);
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
      await this.recipeDao.bulkInsert(recipeList);
      await this.itemDao.bulkInsert(itemDocuments);
      this.logger.log(
        `save recipe : ${recipeList.length}, item ${itemDocuments.length}`,
      );
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

  private async queuedCall(items: any[], functionToCall: AsyncFunction) {
    // create array of 200 parames
    const chunkedParam = chunk(items, this.padding);
    return AsyncUtils.parallelBatch(chunkedParam, functionToCall, 5);
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
