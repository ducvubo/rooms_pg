import { Column, CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm'

export class SampleEntity {
  @CreateDateColumn({ type: 'timestamp' })
  createdAt?: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt?: Date

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt?: Date

  @Column({ type: 'int', default: 0 })
  isDeleted?: 0 | 1

  @Column('varchar', { length: 36, nullable: true })
  createdBy?: string

  @Column('varchar', { length: 36, nullable: true })
  updatedBy?: string

  @Column('varchar', { length: 36, nullable: true })
  deletedBy?: string
}
