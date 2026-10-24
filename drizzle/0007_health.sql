CREATE TABLE item_health(item_id TEXT PRIMARY KEY NOT NULL,user_id TEXT NOT NULL,state TEXT NOT NULL,http_status INTEGER NOT NULL DEFAULT 0,checked INTEGER NOT NULL,missing_count INTEGER NOT NULL DEFAULT 0);
--> statement-breakpoint
CREATE INDEX health_owner ON item_health(user_id,checked);
