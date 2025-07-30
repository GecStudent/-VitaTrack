import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotesToMealLogs1751706534685 implements MigrationInterface {
    name = 'AddNotesToMealLogs1751706534685'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meal_logs" ADD "notes" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "meal_logs" DROP COLUMN "notes"`);
    }
} 