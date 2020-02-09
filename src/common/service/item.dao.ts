import {Injectable, Logger} from "@nestjs/common";
import {ObjectionCrudDao} from "../../database/services/objection-crud.dao";
import {ItemModel} from "../model/item-model";
import {DealCritera} from "../../business-search/deal-critera";

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

        // do not handle buy and sell for knoow
        const builder = ItemModel.query().whereNotNull( "from_recipe_id")
            .withGraphFetched("fromRecipe");


        if (criterias.doNotEvaluate.flags.length) {
            builder.whereNotIn("flags", criterias.doNotEvaluate.flags);
        }
        if (criterias.doNotEvaluate.types.length) {
            builder.whereNotIn("types", criterias.doNotEvaluate.types);
        }
        if (criterias.doNotEvaluate.rarity.length) {
            builder.whereNotIn("rarity", criterias.doNotEvaluate.rarity);
        }

        return await builder.debug().execute()

    }

}
