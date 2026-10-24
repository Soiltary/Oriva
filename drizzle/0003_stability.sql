ALTER TABLE items ADD revision INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE users ADD library_revision INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE INDEX items_owner_order ON items(user_id,updated DESC,id DESC);
