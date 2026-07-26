import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  hashedPassword!: string;

  @Column({ type: 'varchar' })
  role!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
