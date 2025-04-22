import { MENU_CATEGORY_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { MenuItemsEntity } from 'src/menu-items/entities/menu-items.entity'
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

@Entity('menu_category')
export class MenuCategoryEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  mcat_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  mcat_res_id?: string

  @Column('varchar', { length: 255 })
  mcat_name?: string

  @Column('varchar', { length: 255 })
  mcat_description?: string

  @Column('varchar', { length: 255, default: 'enable' })
  mcat_status?: 'enable' | 'disable'

  @OneToMany(() => MenuItemsEntity, (menuItem) => menuItem.category)
  menuItems?: MenuItemsEntity[]
}

@EventSubscriber()
export class MenuCategorySubscriber implements EntitySubscriberInterface<MenuCategoryEntity> {
  listenTo() {
    return MenuCategoryEntity
  }

  async afterInsert(event: InsertEvent<MenuCategoryEntity>): Promise<void> {
    await addDocToElasticsearch(MENU_CATEGORY_ELASTICSEARCH_INDEX, event.entity.mcat_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<MenuCategoryEntity>): Promise<void> {
    await updateDocByElasticsearch(MENU_CATEGORY_ELASTICSEARCH_INDEX, event.entity.mcat_id, event.entity)
  }
}
