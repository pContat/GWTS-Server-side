import { Discipline } from "../business-search/type";

export namespace GuildWarsAPI {
  export interface Details {
    type: string;
    damage_type: string;
    min_power: number;
    max_power: number;
    defense: number;
    infusion_slots: any[];
    infix_upgrade: {
      id: number;
      attributes: any[];
    };
    secondary_suffix_item_id: string;
  }

  export interface ItemDetail {
    name: string;
    type: string;
    level: number;
    rarity: string;
    vendor_value: number;
    default_skin: number;
    game_types: string[];
    flags: string[];
    restrictions: any[];
    id: number;
    chat_link: string;
    icon: string;
    details: Details;
  }

  export interface Ingredient {
    item_id: number;
    count: number;
  }

  export interface RecipeDetail {
    type: string;
    output_item_id: number;
    output_item_count: number;
    min_rating: number;
    time_to_craft_ms: number;
    disciplines: Discipline[];
    flags: string[];
    ingredients: Ingredient[];
    id: number;
    chat_link: string;
  }

  export interface Listing {
    id: number;
    buys: Buy[];
    sells: Sell[];
  }

  export interface Price {
    id: number;
    whitelisted: boolean;
    buys: {
      quantity: number;
      unit_price: number;
    };
    sells: {
      quantity: number;
      unit_price: number;
    };
  }

  export interface Buy {
    /** @description  The number of individual listings this object refers to (e.g. two players selling at the same price will end up in the same listing) */
    listings: number;
    /** @description   The sell offer or buy order price in coins. */
    unit_price: number;
    /** @description   The amount of items being sold/bought in this listing. */
    quantity: number;
  }

  export interface Sell {
    listings: number;
    unit_price: number;
    quantity: number;
  }
}
