import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerifiedColumn1751705855856 implements MigrationInterface {
    name = 'AddEmailVerifiedColumn1751705855856'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerified" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerified"`);
    }
} 