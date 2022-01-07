exports.up = async (knex) => {
  return knex.schema.table('t_e_recipe', (table) => {
    table.boolean('auto_learned').notNull();
    table.integer('min_rating').unsigned().notNull();
  });
};

exports.down = async (knex) => {
  return knex.schema.table('t_e_recipe', (table) => {
    builder.dropColumn('min_rating');
    builder.dropColumn('auto_learned');
  });
};
