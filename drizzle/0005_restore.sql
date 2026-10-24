ALTER TABLE items ADD restore_session TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE TABLE restore_sessions(id TEXT PRIMARY KEY NOT NULL,user_id TEXT NOT NULL,state TEXT NOT NULL,next INTEGER NOT NULL DEFAULT 0,chain TEXT NOT NULL DEFAULT '',source_owner TEXT NOT NULL DEFAULT '',position INTEGER NOT NULL DEFAULT 0,created INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX restores_owner ON restore_sessions(user_id,id);
--> statement-breakpoint
CREATE TABLE restore_records(session_id TEXT NOT NULL,sequence INTEGER NOT NULL,type TEXT NOT NULL,data TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(session_id,sequence));
--> statement-breakpoint
CREATE TABLE restore_maps(session_id TEXT NOT NULL,kind TEXT NOT NULL,source_id TEXT NOT NULL,target_id TEXT NOT NULL,data TEXT NOT NULL DEFAULT '{}',PRIMARY KEY(session_id,kind,source_id));
