CREATE TABLE "calendar_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"date" date NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"minimum_stay" integer DEFAULT 1,
	"maximum_stay" integer DEFAULT 30,
	"notes" text,
	"synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"listing_id" integer,
	"structured" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender" text NOT NULL,
	"content" text NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"reservation_id" integer,
	"guest_name" text NOT NULL,
	"guest_email" text NOT NULL,
	"channel" text DEFAULT 'Direct' NOT NULL,
	"last_message" text,
	"last_message_at" timestamp,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" integer NOT NULL,
	"listing_id" integer NOT NULL,
	"old_price" numeric(10, 2) NOT NULL,
	"new_price" numeric(10, 2) NOT NULL,
	"sync_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'AED' NOT NULL,
	"description" text NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" text DEFAULT 'Dubai' NOT NULL,
	"country_code" varchar(3) DEFAULT 'AE' NOT NULL,
	"area" text NOT NULL,
	"bedrooms_number" integer DEFAULT 0 NOT NULL,
	"bathrooms_number" integer DEFAULT 1 NOT NULL,
	"property_type" text NOT NULL,
	"property_type_id" integer,
	"price" numeric(10, 2) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'AED' NOT NULL,
	"price_floor" numeric(10, 2) NOT NULL,
	"price_ceiling" numeric(10, 2) NOT NULL,
	"person_capacity" integer,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"external_data" jsonb,
	"synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_statements" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"month" text NOT NULL,
	"total_revenue" numeric(10, 2) NOT NULL,
	"total_expenses" numeric(10, 2) NOT NULL,
	"net_income" numeric(10, 2) NOT NULL,
	"occupancy_rate" integer DEFAULT 0 NOT NULL,
	"reservation_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"date" date NOT NULL,
	"current_price" numeric(10, 2) NOT NULL,
	"proposed_price" numeric(10, 2) NOT NULL,
	"change_pct" integer DEFAULT 0 NOT NULL,
	"risk_level" text DEFAULT 'low' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reasoning" text,
	"signals" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_map_id" integer NOT NULL,
	"guest_name" text NOT NULL,
	"guest_email" text,
	"channel_name" text NOT NULL,
	"arrival_date" date NOT NULL,
	"departure_date" date NOT NULL,
	"nights" integer NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"price_per_night" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"check_in_time" text,
	"check_out_time" text,
	"external_data" jsonb,
	"synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasonal_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"price_modifier" integer DEFAULT 0 NOT NULL,
	"minimum_stay" integer,
	"maximum_stay" integer,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"due_date" date,
	"assignee" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_days" ADD CONSTRAINT "calendar_days_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions" ADD CONSTRAINT "executions_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions" ADD CONSTRAINT "executions_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_statements" ADD CONSTRAINT "owner_statements_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_listing_map_id_listings_id_fk" FOREIGN KEY ("listing_map_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasonal_rules" ADD CONSTRAINT "seasonal_rules_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_listing_date_idx" ON "calendar_days" USING btree ("listing_id","date");--> statement-breakpoint
CREATE INDEX "messages_conversation_idx" ON "conversation_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "conversations_listing_idx" ON "conversations" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "conversations_status_idx" ON "conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "expenses_listing_idx" ON "expenses" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("date");--> statement-breakpoint
CREATE INDEX "proposals_listing_date_idx" ON "proposals" USING btree ("listing_id","date");--> statement-breakpoint
CREATE INDEX "proposals_status_idx" ON "proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reservations_listing_idx" ON "reservations" USING btree ("listing_map_id");--> statement-breakpoint
CREATE INDEX "reservations_dates_idx" ON "reservations" USING btree ("arrival_date","departure_date");--> statement-breakpoint
CREATE INDEX "reservations_status_idx" ON "reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "seasonal_rules_listing_idx" ON "seasonal_rules" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "seasonal_rules_dates_idx" ON "seasonal_rules" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "tasks_listing_idx" ON "tasks" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_due_date_idx" ON "tasks" USING btree ("due_date");