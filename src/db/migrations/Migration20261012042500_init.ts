import { Migration } from '@mikro-orm/migrations';

export class Migration20261012042500_init extends Migration {

  override name = 'Migration20261012042500_init';

  override up(): void | Promise<void> {
    this.addSql(`create table "users" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "email" varchar(255) not null, "name" varchar(100) not null, "password_hash" varchar(255) not null, primary key ("id"));`);
    this.addSql(`create index "users_deleted_at_index" on "users" ("deleted_at");`);
    this.addSql(`alter table "users" add constraint "users_email_unique" unique ("email");`);

    this.addSql(`create table "posts" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "title" varchar(255) not null, "content" text not null, "author_id" uuid not null, primary key ("id"));`);
    this.addSql(`create index "posts_deleted_at_index" on "posts" ("deleted_at");`);
    this.addSql(`create index "posts_author_id_index" on "posts" ("author_id");`);

    this.addSql(`create table "comments" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, "content" text not null, "author_id" uuid not null, "post_id" uuid not null, primary key ("id"));`);
    this.addSql(`create index "comments_deleted_at_index" on "comments" ("deleted_at");`);
    this.addSql(`create index "comments_author_id_index" on "comments" ("author_id");`);
    this.addSql(`create index "comments_post_id_index" on "comments" ("post_id");`);

    this.addSql(`alter table "posts" add constraint "posts_author_id_foreign" foreign key ("author_id") references "users" ("id") on delete cascade;`);

    this.addSql(`alter table "comments" add constraint "comments_author_id_foreign" foreign key ("author_id") references "users" ("id") on delete cascade;`);
    this.addSql(`alter table "comments" add constraint "comments_post_id_foreign" foreign key ("post_id") references "posts" ("id") on delete cascade;`);
  }

  override down(): void | Promise<void> {
    this.addSql(`alter table "posts" drop constraint "posts_author_id_foreign";`);
    this.addSql(`alter table "comments" drop constraint "comments_author_id_foreign";`);
    this.addSql(`alter table "comments" drop constraint "comments_post_id_foreign";`);

    this.addSql(`drop table if exists "users" cascade;`);
    this.addSql(`drop table if exists "posts" cascade;`);
    this.addSql(`drop table if exists "comments" cascade;`);
  }

}
