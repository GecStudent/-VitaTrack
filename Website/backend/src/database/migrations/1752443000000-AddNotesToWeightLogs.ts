import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotesToWeightLogs1752443000000 implements MigrationInterface {
    name = 'AddNotesToWeightLogs1752443000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weight_logs" ADD "notes" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "weight_logs" DROP COLUMN "notes"`);
    }
} 