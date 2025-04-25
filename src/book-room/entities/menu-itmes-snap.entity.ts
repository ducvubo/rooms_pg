import { MENU_ITEMS_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
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
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { BookRoomEntity } from './book-room.entity'

@Entity('menu_items_snap')
export class MenuItemsSnapEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  mitems_snap_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  mitems_snap_res_id?: string

  @Column('uuid')
  mitems_snap_bkr_id?: string

  @Column('varchar', { length: 255 })
  mitems_snap_name?: string

  @Column('bigint')
  mitems_snap_price?: number

  @Column('text')
  mitems_snap_image?: string

  @Column('varchar', { length: 255 })
  mitems_snap_note?: string

  @Column('text')
  mitems_snap_description?: string

  @Column('int')
  mitems_snap_quantity?: number

  @ManyToOne(() => BookRoomEntity, (bookRoom) => bookRoom.menuItems)
  @JoinColumn({ name: 'mitems_snap_bkr_id' }) // Khóa ngoại
  bookRoom?: BookRoomEntity


}
