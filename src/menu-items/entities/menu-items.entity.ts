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

@Entity('menu_items')
export class MenuItemsEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  mitems_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  mitems_res_id?: string

  @Column('varchar', { length: 255 })
  mitems_name?: string

  @Column('bigint')
  mitems_price?: number

  @Column('text')
  mitems_image?: string

  @Column('varchar', { length: 255 })
  mitems_note?: string

  @Column('text')
  mitems_description?: string

  @Column('varchar', { length: 255, default: 'enable' })
  mitems_status?: 'enable' | 'disable'

}

@EventSubscriber()
export class MenuItemsSubscriber implements EntitySubscriberInterface<MenuItemsEntity> {
  listenTo() {
    return MenuItemsEntity
  }

  async afterInsert(event: InsertEvent<MenuItemsEntity>): Promise<void> {
    await addDocToElasticsearch(MENU_ITEMS_ELASTICSEARCH_INDEX, event.entity.mitems_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<MenuItemsEntity>): Promise<void> {
    await updateDocByElasticsearch(MENU_ITEMS_ELASTICSEARCH_INDEX, event.entity.mitems_id, event.entity)
  }
}
