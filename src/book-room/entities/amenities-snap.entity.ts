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
  JoinColumn,
  ManyToOne,
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { BookRoomEntity } from './book-room.entity'

@Entity('amenities_snap')
export class AmenitiesSnapEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  ame_snap_id?: string = uuidv4()

  @Column('uuid')
  ame_snap_bkr_id?: string

  @Column('varchar', { length: 24 })
  ame_snap_res_id?: string

  @Column('varchar', { length: 255 })
  ame_snap_name?: string

  @Column('bigint')
  ame_snap_price?: number

  @Column('varchar', { length: 255 })
  ame_snap_note?: string

  @Column('text')
  ame_snap_description?: string

  @Column('int')
  ame_snap_quantity?: number

  @ManyToOne(() => BookRoomEntity, (bookRoom) => bookRoom.amenities)
  @JoinColumn({ name: 'ame_snap_bkr_id' }) // Khóa ngoại
  bookRoom?: BookRoomEntity
}
