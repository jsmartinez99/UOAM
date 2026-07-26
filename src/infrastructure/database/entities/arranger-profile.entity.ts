import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('arranger_profiles')
export class ArrangerProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column('jsonb')
  dimensions!: any;
}
