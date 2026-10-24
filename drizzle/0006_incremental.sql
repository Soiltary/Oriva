ALTER TABLE items ADD change_seq INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE INDEX items_owner_changes ON items(user_id,change_seq);
