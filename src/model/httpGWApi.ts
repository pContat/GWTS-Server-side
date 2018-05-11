
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


