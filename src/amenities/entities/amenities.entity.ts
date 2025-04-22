import { AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
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
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

@Entity('amenities')
export class AmenitiesEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  ame_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  ame_res_id?: string

  @Column('varchar', { length: 255 })
  ame_name?: string

  @Column('bigint')
  ame_price?: number

  @Column('varchar', { length: 255 })
  ame_note?: string

  @Column('text')
  ame_description?: string

  @Column('varchar', { length: 255, default: 'enable' })
  ame_status?: 'enable' | 'disable'
}

@EventSubscriber()
export class AmenitiesSubscriber implements EntitySubscriberInterface<AmenitiesEntity> {
  listenTo() {
    return AmenitiesEntity
  }

  async afterInsert(event: InsertEvent<AmenitiesEntity>): Promise<void> {
    await addDocToElasticsearch(AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX, event.entity.ame_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<AmenitiesEntity>): Promise<void> {
    await updateDocByElasticsearch(AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX, event.entity.ame_id, event.entity)
  }
}
