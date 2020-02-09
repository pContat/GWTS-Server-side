import {Injectable, Logger} from "@nestjs/common";
import {ObjectionCrudDao} from "../../database/services/objection-crud.dao";
import {ItemModel} from "../model/item-model";
import {RecipeModel} from "../model/recipe-model";

@Injectable()
export class RecipeDao extends ObjectionCrudDao<RecipeModel>{

    logger = new Logger(RecipeDao.name);
    constructor(){
        super(RecipeModel)
    }


}
