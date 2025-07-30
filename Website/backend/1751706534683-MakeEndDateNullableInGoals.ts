import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeEndDateNullableInGoals1751706534683 implements MigrationInterface {
    name = 'MakeEndDateNullableInGoals1751706534683'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weight_logs" DROP CONSTRAINT "FK_weight_logs_user"`);
        await queryRunner.query(`ALTER TABLE "water_logs" DROP CONSTRAINT "FK_water_logs_user"`);
        await queryRunner.query(`ALTER TABLE "meal_items" DROP CONSTRAINT "FK_meal_items_meal_log"`);
        await queryRunner.query(`ALTER TABLE "meal_logs" DROP CONSTRAINT "FK_meal_logs_user"`);
        await queryRunner.query(`ALTER TABLE "sleep_logs" DROP CONSTRAINT "FK_sleep_logs_user"`);
        await queryRunner.query(`ALTER TABLE "user_auth" DROP CONSTRAINT "FK_user_auth_user"`);
        await queryRunner.query(`ALTER TABLE "exercise_logs" DROP CONSTRAINT "FK_exercise_logs_exercise"`);
        await queryRunner.query(`ALTER TABLE "exercise_logs" DROP CONSTRAINT "FK_exercise_logs_user"`);
        await queryRunner.query(`ALTER TABLE "goals" DROP CONSTRAINT "FK_goals_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_weight_logs_user_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_water_logs_user_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_meal_logs_user_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_sleep_logs_user_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_exercise_logs_user_date"`);
        await queryRunner.query(`ALTER TABLE "goals" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "goals" ADD "user_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "goals" ALTER COLUMN "end_date" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "goals" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "weight_logs" ADD CONSTRAINT "FK_0341010b3956b50d880f4fe15bc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "water_logs" ADD CONSTRAINT "FK_2042e6d9e9f0b0178f12e27afe0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meal_items" ADD CONSTRAINT "FK_886e51acd91ce028d18b20b641b" FOREIGN KEY ("meal_log_id") REFERENCES "meal_logs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meal_logs" ADD CONSTRAINT "FK_adb226d72e273cda3b02a80dcaa" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sleep_logs" ADD CONSTRAINT "FK_28c64c268a3b78937fb16896ded" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_auth" ADD CONSTRAINT "FK_d887e2dcbfe0682c46c055f93d6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exercise_logs" ADD CONSTRAINT "FK_405e4d50ab89278c83f59e691c3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exercise_logs" ADD CONSTRAINT "FK_6af3b16426363ad9520c06b8f5d" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exercise_logs" DROP CONSTRAINT "FK_6af3b16426363ad9520c06b8f5d"`);
        await queryRunner.query(`ALTER TABLE "exercise_logs" DROP CONSTRAINT "FK_405e4d50ab89278c83f59e691c3"`);
        await queryRunner.query(`ALTER TABLE "user_auth" DROP CONSTRAINT "FK_d887e2dcbfe0682c46c055f93d6"`);
        await queryRunner.query(`ALTER TABLE "sleep_logs" DROP CONSTRAINT "FK_28c64c268a3b78937fb16896ded"`);
        await queryRunner.query(`ALTER TABLE "meal_logs" DROP CONSTRAINT "FK_adb226d72e273cda3b02a80dcaa"`);
        await queryRunner.query(`ALTER TABLE "meal_items" DROP CONSTRAINT "FK_886e51acd91ce028d18b20b641b"`);
        await queryRunner.query(`ALTER TABLE "water_logs" DROP CONSTRAINT "FK_2042e6d9e9f0b0178f12e27afe0"`);
        await queryRunner.query(`ALTER TABLE "weight_logs" DROP CONSTRAINT "FK_0341010b3956b50d880f4fe15bc"`);
        await queryRunner.query(`ALTER TABLE "goals" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "goals" ALTER COLUMN "end_date" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "goals" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "goals" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_exercise_logs_user_date" ON "exercise_logs" ("user_id", "log_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_sleep_logs_user_date" ON "sleep_logs" ("user_id", "log_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_meal_logs_user_date" ON "meal_logs" ("user_id", "log_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_water_logs_user_date" ON "water_logs" ("user_id", "log_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_weight_logs_user_date" ON "weight_logs" ("user_id", "log_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "goals" ADD CONSTRAINT "FK_goals_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exercise_logs" ADD CONSTRAINT "FK_exercise_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exercise_logs" ADD CONSTRAINT "FK_exercise_logs_exercise" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_auth" ADD CONSTRAINT "FK_user_auth_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sleep_logs" ADD CONSTRAINT "FK_sleep_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meal_logs" ADD CONSTRAINT "FK_meal_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "meal_items" ADD CONSTRAINT "FK_meal_items_meal_log" FOREIGN KEY ("meal_log_id") REFERENCES "meal_logs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "water_logs" ADD CONSTRAINT "FK_water_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "weight_logs" ADD CONSTRAINT "FK_weight_logs_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
