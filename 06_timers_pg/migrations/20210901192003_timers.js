exports.up = function (knex) {
  return knex.schema.createTable("timers", (table) => {
    table.increments("id");
    table.integer("user_id").notNullable();
    table.foreign("user_id").references("user_id");
    table.boolean("is_active").notNullable();
    table.text("description").notNullable();
    table.timestamp("start").notNullable();
    table.timestamp("end");
    table.integer("duration");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("timers");
};
