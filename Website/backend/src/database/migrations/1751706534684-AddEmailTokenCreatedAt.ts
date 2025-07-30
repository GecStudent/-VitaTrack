import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailTokenCreatedAt1751706534684 implements MigrationInterface {
    name = 'AddEmailTokenCreatedAt1751706534684'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "emailTokenCreatedAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailTokenCreatedAt"`);
    }
}