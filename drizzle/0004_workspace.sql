ALTER TABLE items ADD body TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE items ADD language TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE items ADD pinned INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE items ADD deleted_at INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE items ADD rating INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE TABLE collections (id TEXT PRIMARY KEY NOT NULL,user_id TEXT NOT NULL,name TEXT NOT NULL,parent_id TEXT NOT NULL DEFAULT '',icon TEXT NOT NULL DEFAULT 'folder',color TEXT NOT NULL DEFAULT '#a98af4',image TEXT NOT NULL DEFAULT '',revision INTEGER NOT NULL DEFAULT 1,created INTEGER NOT NULL,updated INTEGER NOT NULL);
--> statement-breakpoint
CREATE UNIQUE INDEX collections_owner_name ON collections(user_id,name);
--> statement-breakpoint
INSERT INTO collections(id,user_id,name,created,updated) SELECT lower(hex(randomblob(16))),user_id,collection,MIN(created),MAX(updated) FROM items WHERE length(trim(collection))>0 GROUP BY user_id,collection;
--> statement-breakpoint
CREATE TABLE item_revisions(item_id TEXT NOT NULL,user_id TEXT NOT NULL,revision INTEGER NOT NULL,snapshot TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(item_id,revision));
--> statement-breakpoint
CREATE INDEX revisions_owner ON item_revisions(user_id,item_id);
--> statement-breakpoint
CREATE TABLE attachments(id TEXT PRIMARY KEY NOT NULL,user_id TEXT NOT NULL,item_id TEXT NOT NULL,mime TEXT NOT NULL,created INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX attachments_owner ON attachments(user_id,item_id);
--> statement-breakpoint
CREATE TABLE preferences(user_id TEXT PRIMARY KEY NOT NULL,data TEXT NOT NULL DEFAULT '{}',revision INTEGER NOT NULL DEFAULT 1);
