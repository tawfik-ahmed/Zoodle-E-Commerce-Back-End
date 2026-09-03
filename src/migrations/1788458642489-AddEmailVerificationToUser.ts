import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEmailVerificationToUser1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('user', [
      new TableColumn({
        name: 'emailVerificationToken',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'emailVerificationTokenExpiresAt',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user', 'emailVerificationTokenExpiresAt');
    await queryRunner.dropColumn('user', 'emailVerificationToken');
  }
}