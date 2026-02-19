import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('user_shops').ifExists().cascade().execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('user_shops')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('shop_id', 'integer', (col) =>
      col.notNull().references('shops.id').onDelete('cascade'),
    )
    .addColumn('created_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addColumn('updated_at', 'timestamptz', (col) => col.notNull().defaultTo(sql`NOW()`))
    .addUniqueConstraint('user_shops_user_id_shop_id_key', ['user_id', 'shop_id'])
    .execute();
}
