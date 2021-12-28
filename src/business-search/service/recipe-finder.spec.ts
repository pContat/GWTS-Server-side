import { Test } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { ItemModel } from '../../common/model/item-model';
import { ConfigModule } from '../../core/config/config.module';
import { CoreModule } from '../../core/core.module';
import { DatabaseModule } from '../../database/database.module';
import { GwApiModule } from '../../gw-api/gw-api.module';
import { DealFinder } from './deal-finder.service';
import { PriceFinder } from './price-finder.service';
import { RecipeFinderService } from './recipe-finder.service';
import { TradeListingService } from './trade-listing.service';

describe('Recipe finder', () => {
  let recipeFinderService: RecipeFinderService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DealFinder,
        PriceFinder,
        RecipeFinderService,
        TradeListingService,
      ],
      imports: [
        CommonModule,
        GwApiModule,
        CoreModule,
        ConfigModule,
        DatabaseModule,
      ],
    }).compile();

    recipeFinderService = moduleRef.get<RecipeFinderService>(
      RecipeFinderService,
    );
  });

  describe('non craftable object', () => {
    const itemId = 12992;
    it('create', async () => {
      try {
        const item = {};
        const result = await recipeFinderService.getRecipeCraftList(
          item as ItemModel,
        );
        //expect(result.creditNoteSellingItems.length).toEqual(2);
      } catch (e) {
        fail(e);
      }
    });
  });

  describe('craftable object', () => {
    const itemId = 10462;
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
