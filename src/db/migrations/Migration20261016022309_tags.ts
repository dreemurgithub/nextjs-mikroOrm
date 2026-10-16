import { Migration } from '@mikro-orm/migrations';

export class Migration20261016022309_tags extends Migration {

  override name = 'Migration20261016022309_tags';

  override up(): void | Promise<void> {
    this.addSql(`create table "tags" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "name" varchar(50) not null, "slug" varchar(50) not null, primary key ("id"));`);
    this.addSql(`create index "tags_deleted_at_index" on "tags" ("deleted_at");`);
    this.addSql(`alter table "tags" add constraint "tags_slug_unique" unique ("slug");`);

    this.addSql(`alter table "posts" add "tag_id" uuid null;`);
    this.addSql(`alter table "posts" add constraint "posts_tag_id_foreign" foreign key ("tag_id") references "tags" ("id") on delete set null;`);
    this.addSql(`create index "posts_tag_id_index" on "posts" ("tag_id");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "posts" drop constraint "posts_tag_id_foreign";`);

    this.addSql(`drop table if exists "tags" cascade;`);

    this.addSql(`drop index "posts_tag_id_index";`);
    this.addSql(`alter table "posts" drop column "tag_id";`);
  }

}
