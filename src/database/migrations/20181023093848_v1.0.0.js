exports.up = async knex => {
  return knex.schema
    .createTable('t_e_recipe', table => {
      table.increments('id').primary();
      table.integer('output_item_id').notNull();
      table.specificType('disciplines', 'character varying(20)[]'); //array
      table.integer('output_item_count').notNull();
      table.jsonb('ingredients').defaultTo('[]');
      table.string('type').notNull(); //sale or boying
      table.string('chat_link').notNull();
      table.jsonb('crafting_tree');
    })
    .createTable('t_e_item', table => {
      table.increments('id').primary();
      table
        .integer('from_recipe_id')
        .unsigned()
        .references('id')
        .inTable('t_e_recipe');
      table.string('type').notNull(); //sale or boying
      table.string('name').notNull();
      table.string('rarity').notNull();
      table.string('chat_link').notNull();
      table.float('vendor_value').notNull();
      table.string('icon_url'); //canbe null
      table.integer('level').notNull();
      table.specificType('flags', 'text[]'); //array
      // easier to work with jsonb
    });
};

exports.down = async knex => {
  return knex.schema
    .dropTableIfExists('t_e_item')
    .dropTableIfExists('t_e_recipe');
};
