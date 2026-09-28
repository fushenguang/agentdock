CREATE TABLE "activity_completions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activity_completions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"activity_key" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
