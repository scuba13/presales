import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLearningFields1731158400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar campo originalAIAnalysis
    await queryRunner.addColumn(
      'proposals',
      new TableColumn({
        name: 'originalAIAnalysis',
        type: 'jsonb',
        isNullable: true,
        comment: 'Análise original da IA antes de qualquer edição',
      })
    );

    // Adicionar campo userModifications
    await queryRunner.addColumn(
      'proposals',
      new TableColumn({
        name: 'userModifications',
        type: 'jsonb',
        isNullable: true,
        comment: 'Diferenças entre análise original e aprovada',
      })
    );

    // Adicionar campo wasModified
    await queryRunner.addColumn(
      'proposals',
      new TableColumn({
        name: 'wasModified',
        type: 'boolean',
        default: false,
        comment: 'Se a proposta foi editada pelo usuário',
      })
    );

    // Adicionar campo accuracyRating
    await queryRunner.addColumn(
      'proposals',
      new TableColumn({
        name: 'accuracyRating',
        type: 'int',
        isNullable: true,
        comment: 'Rating 1-5 da acurácia da previsão inicial',
      })
    );

    // Adicionar campo feedbackNotes
    await queryRunner.addColumn(
      'proposals',
      new TableColumn({
        name: 'feedbackNotes',
        type: 'text',
        isNullable: true,
        comment: 'Feedback textual do usuário sobre a previsão',
      })
    );

    // Adicionar campo approvedAt
    await queryRunner.addColumn(
      'proposals',
      new TableColumn({
        name: 'approvedAt',
        type: 'timestamp',
        isNullable: true,
        comment: 'Quando a proposta foi aprovada',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('proposals', 'approvedAt');
    await queryRunner.dropColumn('proposals', 'feedbackNotes');
    await queryRunner.dropColumn('proposals', 'accuracyRating');
    await queryRunner.dropColumn('proposals', 'wasModified');
    await queryRunner.dropColumn('proposals', 'userModifications');
    await queryRunner.dropColumn('proposals', 'originalAIAnalysis');
  }
}
