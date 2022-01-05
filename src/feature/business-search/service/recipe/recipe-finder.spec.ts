import { Test, TestingModule } from '@nestjs/testing';
import { ConfigurationModule } from '../../../../core/configuration/configuration.module';
import { CoreModule } from '../../../../core/core.module';
import { DatabaseModule } from '../../../../core/database/database.module';
import { AppLogger } from '../../../../core/logger/winston.logger';
import { GwApiModule } from '../../../gw-api/gw-api.module';
import { ItemModule } from '../../../item/item.module';
import { ItemModel } from '../../../item/model/item-model';
import { ItemDao } from '../../../item/service/item.dao';
import { PriceFinder } from '../price-estimation/price-finder.service';
import { TradeListingService } from '../trade-listing/trade-listing.service';
import { RecipeFinderService } from './recipe-finder.service';

describe('Recipe finder', () => {
  let recipeFinderService: RecipeFinderService;
  let moduleRef: TestingModule;
  let itemDao: ItemDao;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [RecipeFinderService, PriceFinder, TradeListingService],
      imports: [
        ItemModule,
        ConfigurationModule,
        GwApiModule,
        CoreModule,
        DatabaseModule,
      ],
    }).compile();
    const appLogger = moduleRef.get(AppLogger);
    moduleRef.useLogger(appLogger)
    recipeFinderService = moduleRef.get<RecipeFinderService>(
      RecipeFinderService,
    );

    itemDao = moduleRef.get<ItemDao>(ItemDao);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  describe('non craftable item', () => {
    const itemId = 95556;
    //const itemId = 73839;

    it('create', async () => {
      const item = await itemDao.findById(itemId, {
        relationExpression: 'fromRecipe',
      });
      const result = await recipeFinderService.getRecipeCraftList(item);
      console.log(result);
      expect(result).toEqual(undefined);
    }, 200000);
  });

  describe('craftable object', () => {
    const itemId = 73191;
    it('create', async () => {
      /*jest
        .spyOn(recipeFinderService, 'createCreditNoteInvoice')
        .mockImplementation(() => Promise.resolve(new Invoice()));*/

      const craftingTree = {
        data: {
          count: 1,
          itemId: 10462,
          isCraftable: true,
          outputCountIfCraft: 1,
        },
        children: [
          {
            data: {
              count: 1,
              itemId: 19871,
              isCraftable: true,
              outputCountIfCraft: 5,
            },
            children: [
              {
                data: {
                  count: 1,
                  itemId: 71307,
                  isCraftable: false,
                  outputCountIfCraft: 1,
                },
                children: [
                  {
                    data: {
                      count: 10,
                      itemId: 19738,
                      isCraftable: false,
                      outputCountIfCraft: 1,
                    },
                    children: [
                      {
                        data: {
                          count: 2,
                          itemId: 19719,
                          isCraftable: false,
                          outputCountIfCraft: 1,
                        },
                        children: [],
                      },
                    ],
                  },
                  {
                    data: {
                      count: 4,
                      itemId: 19720,
                      isCraftable: false,
                      outputCountIfCraft: 1,
                    },
                    children: [
                      {
                        data: {
                          count: 2,
                          itemId: 19718,
                          isCraftable: false,
                          outputCountIfCraft: 1,
                        },
                        children: [],
                      },
                    ],
                  },
                  {
                    data: {
                      count: 25,
                      itemId: 19792,
                      isCraftable: false,
                      outputCountIfCraft: 1,
                    },
                    children: [],
                  },
                ],
              },
              {
                data: {
                  count: 8,
                  itemId: 24278,
                  isCraftable: false,
                  outputCountIfCraft: 1,
                },
                children: [],
              },
            ],
          },
          {
            data: {
              count: 1,
              itemId: 13110,
              isCraftable: true,
              outputCountIfCraft: 5,
            },
            children: [
              {
                data: {
                  count: 2,
                  itemId: 19679,
                  isCraftable: false,
                  outputCountIfCraft: 1,
                },
                children: [
                  {
                    data: {
                      count: 10,
                      itemId: 19697,
                      isCraftable: false,
                      outputCountIfCraft: 1,
                    },
                    children: [],
                  },
                  {
                    data: {
                      count: 1,
                      itemId: 19704,
                      isCraftable: false,
                      outputCountIfCraft: 1,
                    },
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            data: {
              count: 1,
              itemId: 13107,
              isCraftable: true,
              outputCountIfCraft: 1,
            },
            children: [
              {
                data: {
                  count: 1,
                  itemId: 19720,
                  isCraftable: false,
                  outputCountIfCraft: 1,
                },
                children: [
                  {
                    data: {
                      count: 2,
                      itemId: 19718,
                      isCraftable: false,
                      outputCountIfCraft: 1,
                    },
                    children: [],
                  },
                ],
              },
              {
                data: {
                  count: 1,
                  itemId: 19792,
                  isCraftable: false,
                  outputCountIfCraft: 1,
                },
                children: [],
              },
            ],
          },
        ],
      };
      try {
        const item = { id: itemId, fromRecipe: { craftingTree } };
        const result = await recipeFinderService.getRecipeCraftList(
          item as ItemModel,
        );
        console.log(result);
        //expect(result.creditNoteSellingItems.length).toEqual(2);
      } catch (e) {
        fail(e);
      }
    });
  });
});
