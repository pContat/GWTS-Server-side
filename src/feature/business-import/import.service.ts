import { Inject, Injectable, Logger } from '@nestjs/common';
import { chunk, isNil } from 'lodash';
import { AsyncFunction, AsyncUtils } from '../../common/utils';
import { FileStorageInterface } from '../../core/storage/file-storage.interface';
import { apiStorage } from '../../core/storage/storage-provider';
import { craftingSupplies } from '../business-search/conf/deal-criteria';
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
      this.logger.debug(
        `saved recipe: ${recipeList.length}, saved item: ${itemDocuments.length}`,
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
    return AsyncUtils.batch(chunkedParam, functionToCall, 5);
  }
}
