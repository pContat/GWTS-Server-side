import { Logger } from '@nestjs/common';
import { GuildWarsAPI } from '../gw-api/gw-api-type';
import { Ingredient, Item } from '../item/type/type';
import { Recipe } from '../recipe/type/recipe';
import ItemDetail = GuildWarsAPI.ItemDetail;
import RecipeDetail = GuildWarsAPI.RecipeDetail;
import ApiIngredient = GuildWarsAPI.Ingredient;

const logger = new Logger('GWApiConverter');

export function toItem(itemData: ItemDetail): Item {
  if (!itemData.name) {
    logger.warn(`${itemData.id} as no name`);
  }
  return {
    id: itemData.id,
    type: itemData.type,
    name: itemData.name,
    iconUrl: itemData.icon,
    level: itemData.level,
    rarity: itemData.rarity,
    vendorValue: itemData.vendor_value,
    chatLink: itemData.chat_link,
    flags: itemData.flags,
  };
}

export function toRecipe(recipeDetail: RecipeDetail): Recipe {
  return {
    ingredients: recipeDetail.ingredients.map(toIngredient),
    type: recipeDetail.type,
    outputItemId: recipeDetail.output_item_id,
    outputItemCount: recipeDetail.output_item_count,
    disciplines: recipeDetail.disciplines,
    id: recipeDetail.id,
    chatLink: recipeDetail.chat_link,
    craftingTree: undefined,
  };
}

export function toIngredient(apiIngredient: ApiIngredient): Ingredient {
  return {
    itemId: apiIngredient.item_id,
    count: apiIngredient.count,
    isCraftable: false,
    outputCountIfCraft: 0,
  };
}
