import { TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { TicketGuestRestaurantReplicesEntity } from 'src/tick-guest-restaurant-replices/entities/tick-guest-restaurant-replices.entity'
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

@Entity('ticket_guest_restaurant')
export class TicketGuestRestaurantEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  tkgr_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  tkgr_res_id?: string

  @Column('varchar', { length: 255 })
  id_user_guest?: string

  @Column('bigint', { default: 0 })
  tkgr_user_id?: number

  @Column('varchar', { length: 255 })
  tkgr_user_email?: string

  @Column('varchar', { length: 255 })
  tkgr_title?: string

  @Column('varchar', { length: 255 })
  tkgr_description?: string

  @Column('varchar', { length: 255 })
  tkgr_status?: 'open' | 'in_progress' | 'close' | 'resolved'

  @Column('varchar', { length: 255 })
  tkgr_priority?: 'low' | 'medium' | 'high' | 'urgent'

  @Column('varchar', { length: 255 })
  tkgr_type?: 'book_table' | 'order_dish' | 'Q&A' | 'complain' | 'other'

  @Column('text')
  tkgr_attachment?: string

  @Column('int', { default: 0 })
  tkgr_star?: number

  @Column('varchar', { length: 255, nullable: true })
  tkgr_feedback?: string

  @OneToMany(() => TicketGuestRestaurantReplicesEntity, (replice) => replice.ticketGuestRestaurant, { cascade: true })
  replices?: TicketGuestRestaurantReplicesEntity[]
}

@EventSubscriber()
export class TicketGuestRestaurantSubscriber implements EntitySubscriberInterface<TicketGuestRestaurantEntity> {
  listenTo() {
    return TicketGuestRestaurantEntity
  }

  async afterInsert(event: InsertEvent<TicketGuestRestaurantEntity>): Promise<void> {
    await addDocToElasticsearch(TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX, event.entity.tkgr_id, event.entity)
  }

  async afterUpdate(event: UpdateEvent<TicketGuestRestaurantEntity>): Promise<void> {
    await updateDocByElasticsearch(TICKET_GUEST_RESTAURANT_ELASTICSEARCH_INDEX, event.entity.tkgr_id, event.entity)
  }
}
