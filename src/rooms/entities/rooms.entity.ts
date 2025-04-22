import { ROOMS_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { addDocToElasticsearch, updateDocByElasticsearch } from 'src/utils/elasticsearch'
import { SampleEntity } from 'src/utils/sample.entity'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  OneToMany
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('rooms')
export class RoomsEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  room_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  room_res_id?: string

  @Column('varchar', { length: 255 })
  room_name?: string

  @Column('varchar', { length: 255 })
  room_fix_ame?: string

  @Column('int')
  room_max_guest?: number

  @Column('int')
  room_base_price?: number

  @Column('varchar', { length: 255 })
  room_area?: string

  @Column('varchar', { length: 255 })
  room_note?: string

  @Column('text')
  room_images?: string

  @Column('varchar', { length: 255 })
  room_description?: string

  @Column('varchar', { length: 255, default: 'enable' })
  room_status?: 'enable' | 'disable'
}

@EventSubscriber()
export class RoomsSubscriber implements EntitySubscriberInterface<RoomsEntity> {
  listenTo() {
    return RoomsEntity
  }

  async afterInsert(event: InsertEvent<RoomsEntity>): Promise<void> {
    await addDocToElasticsearch(ROOMS_ELASTICSEARCH_INDEX, event.entity.room_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<RoomsEntity>): Promise<void> {
    await updateDocByElasticsearch(ROOMS_ELASTICSEARCH_INDEX, event.entity.room_id, event.entity)
  }
}
