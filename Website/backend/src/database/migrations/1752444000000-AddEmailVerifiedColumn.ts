import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerifiedColumn1752444000000 implements MigrationInterface {
    name = 'AddEmailVerifiedColumn1752444000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verified" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified"`);
    }
} 