import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Dimensions6D } from '../../../domain/arranger-profile.js';

@Entity('arranger_profiles')
export class ArrangerProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column('jsonb')
  dimensions!: Dimensions6D;
}
