import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeToProposalMetrics1762874851398 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remover a constraint existente
        await queryRunner.query(`
            ALTER TABLE "proposal_metrics"
            DROP CONSTRAINT IF EXISTS "FK_1ff0bdc720cf18f1d20be26d995"
        `);

        // Adicionar novamente com ON DELETE CASCADE
        await queryRunner.query(`
            ALTER TABLE "proposal_metrics"
            ADD CONSTRAINT "FK_1ff0bdc720cf18f1d20be26d995"
            FOREIGN KEY ("proposalId")
            REFERENCES "proposals"("id")
            ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover a constraint com CASCADE
        await queryRunner.query(`
            ALTER TABLE "proposal_metrics"
            DROP CONSTRAINT IF EXISTS "FK_1ff0bdc720cf18f1d20be26d995"
        `);

        // Adicionar novamente sem CASCADE (estado original)
        await queryRunner.query(`
            ALTER TABLE "proposal_metrics"
            ADD CONSTRAINT "FK_1ff0bdc720cf18f1d20be26d995"
            FOREIGN KEY ("proposalId")
            REFERENCES "proposals"("id")
        `);
    }

}
