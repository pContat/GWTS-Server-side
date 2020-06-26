import {Injectable, Logger} from "@nestjs/common";
import {ObjectionCrudDao} from "../../database/services/objection-crud.dao";
import {ItemModel} from "../model/item-model";
import {DealCritera} from "../../business-search/type";

@Injectable()
export class ItemDao extends ObjectionCrudDao<ItemModel>{

    logger = new Logger(ItemDao.name);
    constructor(){
        super(ItemModel)
    }

    async getVendorPrice(itemId: number): Promise<number> {
        const item = await this.findById(itemId);
        return item.vendorValue;
    }

    async isEmpty(): Promise<boolean> {
        const countObject = await ItemModel.query().count();
        return (<any>countObject)[0].count == 0;
    }


    async getMatchingCriteriaItem(criteria: DealCritera) {
        return this.buildCriteriaQuery(criteria);
    }

    private async buildCriteriaQuery(criterias: DealCritera) {

        const builder = ItemModel.query()
            .withGraphFetched("fromRecipe")
            .orderBy('id', 'desc');

        //SELECT * FROM t_e_item WHERE 'AccountBound' = ANY (flags);
        //SELECT flags FROM t_e_item WHERE NOT flags && ARRAY['HideSuffix', 'NoSell']::varchar[] ;
        if (criterias.doNotEvaluate.flags.length) {
            const flagsString = criterias.doNotEvaluate.flags.map( el => `'${el}'`).join(",");
            // && => have element in common
            builder.whereRaw(`NOT flags && ARRAY[${flagsString}]::varchar[]`);
        }
        if (criterias.doNotEvaluate.types.length) {
            builder.whereNotIn("type", criterias.doNotEvaluate.types);
        }
        if (criterias.doNotEvaluate.rarity.length) {
            builder.whereNotIn("rarity", criterias.doNotEvaluate.rarity);
        }
        if (criterias.doNotEvaluate.itemList.length) {
            builder.whereNotIn("id", criterias.doNotEvaluate.itemList);
        }

        // order by ids desc
        return await builder.execute()

    }

}
