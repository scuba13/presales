import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateProposalMetrics1731158500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'proposal_metrics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'proposalId',
            type: 'uuid',
          },
          {
            name: 'durationAccuracy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            comment: 'Acurácia da previsão de duração (0-100%)',
          },
          {
            name: 'costAccuracy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            comment: 'Acurácia da previsão de custo (0-100%)',
          },
          {
            name: 'teamSizeAccuracy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            comment: 'Acurácia da previsão de tamanho da equipe (0-100%)',
          },
          {
            name: 'overallAccuracy',
            type: 'decimal',
            precision: 5,
            scale: 2,
            comment: 'Acurácia geral (média ponderada)',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Adicionar foreign key
    await queryRunner.createForeignKey(
      'proposal_metrics',
      new TableForeignKey({
        columnNames: ['proposalId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'proposals',
        onDelete: 'CASCADE',
      })
    );

    // Criar índice para melhor performance
    await queryRunner.query(
      `CREATE INDEX "IDX_proposal_metrics_proposalId" ON "proposal_metrics" ("proposalId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('proposal_metrics', 'IDX_proposal_metrics_proposalId');
    await queryRunner.dropTable('proposal_metrics');
  }
}
