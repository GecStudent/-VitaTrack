import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1684123456789 implements MigrationInterface {
    name = 'InitialSchema1684123456789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password_hash" character varying NOT NULL,
                "first_name" character varying NOT NULL,
                "last_name" character varying NOT NULL,
                "birth_date" date,
                "gender" character varying,
                "height" double precision,
                "current_weight" double precision,
                "goal_weight" double precision,
                "activity_level" character varying,
                "preferences" json,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

        // User Auth table
        await queryRunner.query(`
            CREATE TABLE "user_auth" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "provider" character varying NOT NULL,
                "provider_id" character varying NOT NULL,
                "provider_data" json NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_auth" PRIMARY KEY ("id"),
                CONSTRAINT "FK_user_auth_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Goals table
        await queryRunner.query(`
            CREATE TABLE "goals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "goal_type" character varying NOT NULL,
                "target_value" double precision NOT NULL,
                "start_date" date NOT NULL,
                "target_date" date NOT NULL,
                "status" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_goals" PRIMARY KEY ("id"),
                CONSTRAINT "FK_goals_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Weight Logs table
        await queryRunner.query(`
            CREATE TABLE "weight_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "weight" double precision NOT NULL,
                "log_date" date NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_weight_logs" PRIMARY KEY ("id"),
                CONSTRAINT "FK_weight_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Exercises table
        await queryRunner.query(`
            CREATE TABLE "exercises" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "category" character varying NOT NULL,
                "muscle_group" character varying NOT NULL,
                "equipment" character varying NOT NULL,
                "difficulty" character varying NOT NULL,
                "instructions" character varying NOT NULL,
                "calories_per_min" double precision NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_exercises" PRIMARY KEY ("id")
            )
        `);

        // Exercise Logs table
        await queryRunner.query(`
            CREATE TABLE "exercise_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "exercise_id" uuid NOT NULL,
                "duration" integer NOT NULL,
                "sets" integer,
                "reps" integer,
                "weight" double precision,
                "calories_burned" integer NOT NULL,
                "log_date" date NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_exercise_logs" PRIMARY KEY ("id"),
                CONSTRAINT "FK_exercise_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_exercise_logs_exercise" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE
            )
        `);

        // Meal Logs table
        await queryRunner.query(`
            CREATE TABLE "meal_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "meal_type" character varying NOT NULL,
                "log_date" date NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_meal_logs" PRIMARY KEY ("id"),
                CONSTRAINT "FK_meal_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Meal Items table
        await queryRunner.query(`
            CREATE TABLE "meal_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "meal_log_id" uuid NOT NULL,
                "food_id" character varying NOT NULL,
                "serving_size" double precision NOT NULL,
                "serving_unit" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_meal_items" PRIMARY KEY ("id"),
                CONSTRAINT "FK_meal_items_meal_log" FOREIGN KEY ("meal_log_id") REFERENCES "meal_logs"("id") ON DELETE CASCADE
            )
        `);

        // Water Logs table
        await queryRunner.query(`
            CREATE TABLE "water_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "amount" double precision NOT NULL,
                "unit" character varying NOT NULL,
                "log_date" date NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_water_logs" PRIMARY KEY ("id"),
                CONSTRAINT "FK_water_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Sleep Logs table
        await queryRunner.query(`
            CREATE TABLE "sleep_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "sleep_start" TIMESTAMP NOT NULL,
                "sleep_end" TIMESTAMP NOT NULL,
                "quality" integer NOT NULL,
                "log_date" date NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_sleep_logs" PRIMARY KEY ("id"),
                CONSTRAINT "FK_sleep_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Create extension for UUID generation if it doesn't exist
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create indexes for performance
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_weight_logs_user_date" ON "weight_logs" ("user_id", "log_date")`);
        await queryRunner.query(`CREATE INDEX "IDX_exercise_logs_user_date" ON "exercise_logs" ("user_id", "log_date")`);
        await queryRunner.query(`CREATE INDEX "IDX_meal_logs_user_date" ON "meal_logs" ("user_id", "log_date")`);
        await queryRunner.query(`CREATE INDEX "IDX_water_logs_user_date" ON "water_logs" ("user_id", "log_date")`);
        await queryRunner.query(`CREATE INDEX "IDX_sleep_logs_user_date" ON "sleep_logs" ("user_id", "log_date")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order to avoid foreign key constraints
        await queryRunner.query(`DROP TABLE "sleep_logs"`);
        await queryRunner.query(`DROP TABLE "water_logs"`);
        await queryRunner.query(`DROP TABLE "meal_items"`);
        await queryRunner.query(`DROP TABLE "meal_logs"`);
        await queryRunner.query(`DROP TABLE "exercise_logs"`);
        await queryRunner.query(`DROP TABLE "exercises"`);
        await queryRunner.query(`DROP TABLE "weight_logs"`);
        await queryRunner.query(`DROP TABLE "goals"`);
        await queryRunner.query(`DROP TABLE "user_auth"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}