CREATE TABLE "greetings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "greetings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
