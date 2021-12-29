import { Inject, Injectable, Logger } from '@nestjs/common';
import { ObjectionCrudDao } from '../../../core/database/services/objection-crud.dao';
import { ItemModel } from '../model/item-model';
import { DealCriteria } from '../../business-search/type';

@Injectable()
export class ItemDao extends ObjectionCrudDao<ItemModel> {
  logger = new Logger(ItemDao.name);
  constructor(@Inject(ItemModel) private readonly itemModel: typeof ItemModel) {
    super(itemModel);
  }

  async getVendorPrice(itemId: number): Promise<number> {
    const item = await this.findById(itemId);
    return item.vendorValue;
  }

  async isEmpty(): Promise<boolean> {
    const countObject = await ItemModel.query().count();
    return (<any>countObject)[0].count == 0;
  }

  async getMatchingCriteriaItem(criteria: DealCriteria) {
    return this.buildCriteriaQuery(criteria);
  }

  private async buildCriteriaQuery(criteria: DealCriteria) {
    const builder = ItemModel.query()
      .withGraphFetched('fromRecipe')
      .orderBy('id', 'desc');

    //SELECT * FROM t_e_item WHERE 'AccountBound' = ANY (flags);
    //SELECT flags FROM t_e_item WHERE NOT flags && ARRAY['HideSuffix', 'NoSell']::varchar[] ;
    if (criteria.doNotEvaluate.flags.length) {
      const flagsString = criteria.doNotEvaluate.flags
        .map(el => `'${el}'`)
        .join(',');
      // && => have element in common
      builder.whereRaw(`NOT flags && ARRAY[${flagsString}]`);
    }
    if (criteria.doNotEvaluate.types.length) {
      builder.whereNotIn('type', criteria.doNotEvaluate.types);
    }
    if (criteria.doNotEvaluate.rarity.length) {
      builder.whereNotIn('rarity', criteria.doNotEvaluate.rarity);
    }
    if (criteria.doNotEvaluate.itemList.length) {
      builder.whereNotIn('id', criteria.doNotEvaluate.itemList);
    }

    // order by ids desc
    return builder;
  }
}
