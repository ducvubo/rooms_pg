import { SampleEntity } from 'src/utils/sample.entity'
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { RoomsEntity } from 'src/rooms/entities/rooms.entity'
import { AmenitiesSnapEntity } from './amenities-snap.entity'
import { MenuItemsSnapEntity } from './menu-itmes-snap.entity'

export enum BookRoomStatus {
  NEW_CREATED = 'NEW_CREATED',
  OVERTIME_GUEST = 'OVERTIME_GUEST',
  CANCEL_GUEST = 'CANCEL_GUEST',
  WAITING_RESTAURANT = 'WAITING_RESTAURANT',
  RESTAURANT_CONFIRM_DEPOSIT = 'RESTAURANT_CONFIRM_DEPOSIT',
  CANCEL_RESTAURANT = 'CANCEL_RESTAURANT',
  RESTAURANT_CONFIRM = 'RESTAURANT_CONFIRM',
  GUEST_CHECK_IN = 'GUEST_CHECK_IN',
  GUEST_CHECK_OUT = 'GUEST_CHECK_OUT',
  GUEST_CHECK_OUT_OVERTIME = 'GUEST_CHECK_OUT_OVERTIME',
  NO_SHOW = 'NO_SHOW',
  RESTAURANT_REFUND_DEPOSIT = 'RESTAURANT_REFUND_DEPOSIT',
  RESTAURANT_REFUND_ONE_THIRD_DEPOSIT = 'RESTAURANT_REFUND_ONE_THIRD',
  RESTAURANT_REFUND_ONE_TWO_DEPOSITE = 'RESTAURANT_REFUND_ONE_TWO_DEPOSITE',
  RESTAURANT_NO_DEPOSIT = 'RESTAURANT_NO_DEPOSIT',
  IN_USE = "IN_USE",
  RESTAURANT_CONFIRM_PAYMENT = 'RESTAURANT_CONFIRM_PAYMENT',
  GUEST_COMPLAINT = 'GUEST_COMPLAINT',
  DONE_COMPLAINT = 'DONE_COMPLAINT',
  RESTAURANT_EXCEPTION = 'RESTAURANT_EXCEPTION',
  GUEST_EXCEPTION = 'GUEST_EXCEPTION'
}

@Entity('book-room')
export class BookRoomEntity extends SampleEntity {
  @PrimaryGeneratedColumn('uuid')
  bkr_id?: string = uuidv4()

  @Column('varchar', { length: 24 })
  bkr_res_id?: string

  @Column('varchar', { length: 36 })
  bkr_room_id?: string

  @Column('varchar', { length: 255 })
  bkr_guest_id?: string

  @Column('varchar', { length: 255 })
  bkr_ame?: string

  @Column('varchar', { length: 255 })
  bkr_email?: string

  @Column('varchar', { length: 255 })
  bkr_phone?: string

  @Column('timestamp')
  bkr_time_start?: Date

  @Column('timestamp')
  bkr_time_end?: Date

  @Column('timestamp', { nullable: true })
  bkr_check_in?: Date

  @Column('timestamp', { nullable: true })
  bkr_check_out?: Date

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  bkr_created_at?: Date

  @Column('varchar', { length: 255 })
  bkr_note?: string

  @Column('varchar', { length: 255, nullable: true })
  bkr_note_res?: string

  @Column('varchar', { length: 255, nullable: true })
  bkr_feedback?: string

  @Column('varchar', { length: 255, nullable: true })
  bkr_reply?: string

  @Column('int', { nullable: true })
  bkr_star?: 1 | 2 | 3 | 4 | 5

  @Column('varchar', { length: 255, default: 'disable' })
  bkr_feed_view?: 'active' | 'disable'

  @Column('varchar', { length: 255, nullable: true })
  bkr_reason_cancel?: string

  @Column('text')
  bkr_detail_history?: string

  @Column({
    type: 'enum',
    enum: BookRoomStatus,
    default: BookRoomStatus.NEW_CREATED,
  })
  bkr_status: BookRoomStatus

  @Column('int', { nullable: true })
  bkr_plus_price?: number

  @Column('int', { nullable: true })
  bkr_base_price?: number

  @Column('int', { nullable: true })
  bkr_deposit_price?: number

  @OneToMany(() => AmenitiesSnapEntity, (amenity) => amenity.bookRoom)
  amenities?: AmenitiesSnapEntity[]

  @OneToMany(() => MenuItemsSnapEntity, (menuItem) => menuItem.bookRoom)
  menuItems?: MenuItemsSnapEntity[]

  // thêm quan hệ với room
  @ManyToOne(() => RoomsEntity, (room) => room.bookings, { eager: false })
  @JoinColumn({ name: 'bkr_room_id', referencedColumnName: 'room_id' })
  room?: RoomsEntity
}
