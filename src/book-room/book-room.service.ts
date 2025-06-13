import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, In, LessThanOrEqual, Like, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { AmenitiesSnapEntity } from './entities/amenities-snap.entity';
import { BookRoomEntity, BookRoomStatus } from './entities/book-room.entity';
import { CreateBookRoomDto } from './dto/create-book-room.dto';
import { saveLogSystem } from 'src/log/sendLog.els';
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse';
import { AmenitiesEntity } from 'src/amenities/entities/amenities.entity';
import { MenuItemsEntity } from 'src/menu-items/entities/menu-items.entity';
import { MenuItemsSnapEntity } from './entities/menu-itmes-snap.entity';
import { sendMessageToKafka } from 'src/utils/kafka';
import { IAccount } from 'src/guard/interface/account.interface';
import { ResultPagination } from 'src/interface/resultPagination.interface';
import kafkaInstance from '../config/kafka.config'

// export enum BookRoomStatus {
//   NEW_CREATED = 'NEW_CREATED',
//   OVERTIME_GUEST = 'OVERTIME_GUEST',
//   CANCEL_GUEST = 'CANCEL_GUEST',
//   WAITING_RESTAURANT = 'WAITING_RESTAURANT',
//   RESTAURANT_CONFIRM_DEPOSIT = 'RESTAURANT_CONFIRM_DEPOSIT',
//   CANCEL_RESTAURANT = 'CANCEL_RESTAURANT',
//   RESTAURANT_CONFIRM = 'RESTAURANT_CONFIRM',
//   GUEST_CHECK_IN = 'GUEST_CHECK_IN',
//   GUEST_CHECK_OUT = 'GUEST_CHECK_OUT',
//   GUEST_CHECK_OUT_OVERTIME = 'GUEST_CHECK_OUT_OVERTIME',
//   NO_SHOW = 'NO_SHOW',
//   RESTAURANT_REFUND_DEPOSIT = 'RESTAURANT_REFUND_DEPOSIT',
//   RESTAURANT_REFUND_ONE_THIRD_DEPOSIT = 'RESTAURANT_REFUND_ONE_THIRD',
//   RESTAURANT_REFUND_ONE_TWO_DEPOSITE = 'RESTAURANT_REFUND_ONE_TWO_DEPOSITE',
//   RESTAURANT_NO_DEPOSIT = 'RESTAURANT_NO_DEPOSIT',
//   IN_USE = "IN_USE",
//   RESTAURANT_CONFIRM_PAYMENT = 'RESTAURANT_CONFIRM_PAYMENT',
//   GUEST_COMPLAINT = 'GUEST_COMPLAINT',
//   DONE_COMPLAINT = 'DONE_COMPLAINT',
//   RESTAURANT_EXCEPTION = 'RESTAURANT_EXCEPTION',
//   GUEST_EXCEPTION = 'GUEST_EXCEPTION'
// }

@Injectable()
export class BookRoomService implements OnModuleInit {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(BookRoomEntity)
    private readonly bookRoomRepo: Repository<BookRoomEntity>,
  ) { }

  async onModuleInit() {
    const consumer = await kafkaInstance.getConsumer('SYNC_CLIENT_ID_BOOK_ROOM')
    await consumer.subscribe({ topic: 'SYNC_CLIENT_ID', fromBeginning: true })
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const dataMessage = message.value.toString()
        const data = JSON.parse(dataMessage)
        const { clientIdOld, clientIdNew } = data
        this.syncBookRoom({ clientIdOld, clientIdNew }).catch((error) => {
          saveLogSystem({
            action: 'onModuleInit',
            error: error,
            class: 'BookRoomService',
            function: 'onModuleInit',
            message: error.message,
            time: new Date(),
            type: 'error'
          })
        })
      }
    })
  }


  async syncBookRoom({ clientIdOld, clientIdNew }: { clientIdOld: string, clientIdNew: string }) {
    try {
      const bookRoom = await this.bookRoomRepo.find({
        where: {
          bkr_guest_id: clientIdOld
        }
      })

      if (!bookRoom) {
        throw new BadRequestError('Đơn đặt phòng không tồn tại hoặc đã bị xóa, vui lòng thử lại sau')
      }

      await Promise.all(
        bookRoom.map(async (item) => {
          item.bkr_guest_id = clientIdNew
          await this.bookRoomRepo.save(item)
        })
      )
    } catch (error) {
      saveLogSystem({
        action: 'syncBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'syncBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async createBookRoom(createBookRoomDto: CreateBookRoomDto, bkr_guest_id: string): Promise<BookRoomEntity> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const { amenities, bkr_ame, bkr_email, bkr_note, bkr_phone, bkr_res_id, bkr_time_end, bkr_time_start, menu_items, bkr_link_confirm } = createBookRoomDto

      //check xem có đơn đặt phòng nào cùng thời gian không loại trừ các đơn OVERTIME_GUEST, CANCEL_GUEST, CANCEL_RESTAURANT, GUEST_EXCEPTION, GUEST_CHECK_IN, GUEST_CHECK_OUT, GUEST_CHECK_OUT_OVERTIME, NO_SHOW, DONE_COMPLAINT, RESTAURANT_EXCEPTION, RESTAURANT_NO_DEPOSIT, RESTAURANT_REFUND_DEPOSIT, RESTAURANT_REFUND_ONE_THIRD_DEPOSIT, RESTAURANT_REFUND_ONE_TWO_DEPOSITE, RESTAURANT_NO_DEPOSIT, IN_USE, RESTAURANT_CONFIRM_PAYMENT, GUEST_COMPLAINT
      const bookRoomExist = await queryRunner.manager.findOne(BookRoomEntity, {
        where: {
          bkr_res_id: bkr_res_id,
          bkr_time_start: Between(new Date(bkr_time_start), new Date(bkr_time_end)),
          bkr_status: Not(In([BookRoomStatus.OVERTIME_GUEST, BookRoomStatus.CANCEL_GUEST, BookRoomStatus.CANCEL_RESTAURANT, BookRoomStatus.GUEST_EXCEPTION, BookRoomStatus.GUEST_CHECK_IN, BookRoomStatus.GUEST_CHECK_OUT, BookRoomStatus.GUEST_CHECK_OUT_OVERTIME, BookRoomStatus.NO_SHOW, BookRoomStatus.DONE_COMPLAINT, BookRoomStatus.RESTAURANT_EXCEPTION, BookRoomStatus.RESTAURANT_NO_DEPOSIT, BookRoomStatus.RESTAURANT_REFUND_DEPOSIT, BookRoomStatus.RESTAURANT_REFUND_ONE_THIRD_DEPOSIT, BookRoomStatus.RESTAURANT_REFUND_ONE_TWO_DEPOSITE, BookRoomStatus.RESTAURANT_NO_DEPOSIT, BookRoomStatus.IN_USE, BookRoomStatus.RESTAURANT_CONFIRM_PAYMENT, BookRoomStatus.GUEST_COMPLAINT]))
        }
      })

      if (bookRoomExist) {
        throw new BadRequestError('Đã có đơn đặt phòng trong thời gian này')
      }

      const bookRoom = await queryRunner.manager.save(BookRoomEntity, {
        bkr_ame, bkr_email, bkr_note, bkr_phone, bkr_res_id, bkr_time_end, bkr_time_start, bkr_guest_id,
        bkr_status: BookRoomStatus.NEW_CREATED,
        bkr_detail_history: JSON.stringify([
          {
            type: 'Khách đặt phòng',
            description: 'Khách hàng đã phòng, vui lòng xác nhận trong email trong vòng 10 phút',
            time: new Date()
          }
        ])
      })

      await Promise.all(
        amenities.map(async (amenity) => {
          const amenityExist = await queryRunner.manager.findOne(AmenitiesEntity, {
            where: {
              ame_id: amenity.amenity_id,
              ame_res_id: bkr_res_id,
              ame_status: 'enable',
            },
          })
          if (!amenityExist) {
            throw new BadRequestError('Dịch vụ tiện ích không tồn tại hoặc đã bị xóa')
          }

          await queryRunner.manager.save(AmenitiesSnapEntity, {
            ame_snap_bkr_id: bookRoom.bkr_id,
            ame_snap_res_id: bkr_res_id,
            ame_snap_name: amenityExist.ame_name,
            ame_snap_price: amenityExist.ame_price,
            ame_snap_note: amenityExist.ame_note,
            ame_snap_description: amenityExist.ame_description,
            ame_snap_quantity: amenity.bkr_amenity_quantity
          })
        }),
      )

      await Promise.all(
        menu_items.map(async (menu) => {
          const menuExist = await queryRunner.manager.findOne(MenuItemsEntity, {
            where: {
              mitems_id: menu.menu_id,
              mitems_res_id: bkr_res_id,
              mitems_status: 'enable'
            }
          })

          await queryRunner.manager.save(MenuItemsSnapEntity, {
            mitems_snap_res_id: bkr_res_id,
            mitems_snap_bkr_id: bookRoom.bkr_id,
            mitems_snap_name: menuExist.mitems_name,
            mitems_snap_price: menuExist.mitems_price,
            mitems_snap_image: menuExist.mitems_image,
            mitems_snap_note: menuExist.mitems_note,
            mitems_snap_description: menuExist.mitems_description,
            mitems_snap_quantity: menu.bkr_menu_quantity,
          })

        })
      )
      const linkConfirm = `${bkr_link_confirm}?bkr_id=${bookRoom.bkr_id}&bkr_res_id=${bkr_res_id}`
      console.log('link confirm', linkConfirm)
      sendMessageToKafka({
        topic: 'CREATE_BOOKING_ROOM',
        message: JSON.stringify({
          to: bkr_email,
          subject: 'Xác nhận đặt phòng',
          text: `Bạn nhận được email này vì bạn đã đặt phòng tổ chức sự kiện tại nhà hàng. Thông tin của bạn như sau: \n\nTên khách hàng: ${bkr_ame}\nSố điện thoại: ${bkr_phone}\nEmail: ${bkr_email}\nThời gian bắt đầu: ${bkr_time_start}\nThời gian kết thúc: ${bkr_time_end}\nGhi chú: ${bkr_note}\n\nĐể xác nhận đơn hàng, vui lòng nhấp vào liên kết bên dưới:\n${linkConfirm}. Nếu bạn không phải là người nhận email này, vui lòng bỏ qua nó.`,
        })
      })

      await queryRunner.commitTransaction()
      return bookRoom
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'createBookRoomEntity',
        error: error,
        class: 'BookRoomService',
        function: 'createBookRoomEntity',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    } finally {
      await queryRunner.release()
    }
  }

  async guestConfirmBookRoom(bkr_id: string, bkr_res_id: string): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.NEW_CREATED) {
        throw new BadRequestError('Đặt phòng đã được xác nhận hoặc đã hủy')
      }

      bookRoomExist.bkr_status = BookRoomStatus.WAITING_RESTAURANT
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Khách hàng xác nhận',
          description: 'Khách hàng đã xác nhận đặt phòng, đợi xác nhận từ nhà hàng',
          time: new Date()
        }
      ])

      await this.bookRoomRepo.save(bookRoomExist)

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: bookRoomExist.bkr_res_id,
          noti_content: `Nhà hàng vừa có đơn hàng đặt phòng mới từ ${bookRoomExist.bkr_ame}`,
          noti_title: `Đặt phòng`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'guestConfirmBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'guestConfirmBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantConfirmDepositBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.WAITING_RESTAURANT) {
        throw new BadRequestError('Đặt phòng đã được xác nhận hoặc đã hủy')
      }

      bookRoomExist.bkr_status = BookRoomStatus.RESTAURANT_CONFIRM_DEPOSIT
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng xác nhận đặt cọc',
          description: 'Nhà hàng đã xác nhận khách hàng đã đặt cọc',
          time: new Date()
        }])
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'restaurantConfirmDepositBookRoom',
        class: 'BookRoomService',
        function: 'restaurantConfirmDepositBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
        error: error
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantConfirmBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.RESTAURANT_CONFIRM_DEPOSIT) {
        throw new BadRequestError('Khách hàng chưa đặt cọc không thể xác nhận')
      }

      bookRoomExist.bkr_status = BookRoomStatus.RESTAURANT_CONFIRM
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng xác nhận',
          description: 'Nhà hàng đã xác nhận đặt phòng, vui lòng đến nhà hàng đúng giờ để nhận phòng',
          time: new Date()
        }
      ])

      await this.bookRoomRepo.save(bookRoomExist)

      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'restaurantConfirmBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantConfirmBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async guestCancelBookRoom(bkr_id: string, bkr_reason_cancel: string): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.NEW_CREATED) {
        throw new BadRequestError('Đặt phòng đã được xác nhận hoặc đã hủy')
      }

      bookRoomExist.bkr_status = BookRoomStatus.CANCEL_GUEST
      bookRoomExist.bkr_reason_cancel = bkr_reason_cancel
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Khách hàng hủy đặt phòng',
          description: `Khách hàng đã hủy đặt phòng, lý do: ${bkr_reason_cancel}`,
          time: new Date()
        }
      ])

      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'guestCancelBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'guestCancelBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantCancelBookRoom(bkr_id: string, bkr_reason_cancel: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.WAITING_RESTAURANT) {
        throw new BadRequestError('Đặt phòng đã được xác nhận hoặc đã hủy')
      }

      bookRoomExist.bkr_status = BookRoomStatus.CANCEL_RESTAURANT
      bookRoomExist.bkr_reason_cancel = bkr_reason_cancel
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng hủy đặt phòng',
          description: `Nhà hàng đã hủy đặt phòng, lý do: ${bkr_reason_cancel}`,
          time: new Date()
        }
      ])

      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'restaurantCancelBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantCancelBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantCheckInBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.RESTAURANT_CONFIRM) {
        throw new BadRequestError("Nhà hàng chưa xác nhận đặt phòng hoặc đã hủy")
      }

      bookRoomExist.bkr_status = BookRoomStatus.GUEST_CHECK_IN
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng đã xác nhận',
          description: 'Nhà hàng đã xác nhận khách hàng đã đến',
          time: new Date()
        }
      ])

      await this.bookRoomRepo.save(bookRoomExist)

      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'restaurantCheckInBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantCheckInBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantInUseBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.GUEST_CHECK_IN) {
        throw new BadRequestError("Nhà hàng chưa xác nhận đặt phòng hoặc đã hủy")
      }

      bookRoomExist.bkr_status = BookRoomStatus.IN_USE
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng xác nhận phòng đang sử dụng',
          description: 'Nhà hàng đã đã xác phòng đang sử dụng',
          time: new Date()
        }
      ])
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'restaurantInUseBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantInUseBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantNoShowBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.RESTAURANT_CONFIRM) {
        throw new BadRequestError("Nhà hàng chưa xác nhận đặt phòng hoặc đã hủy")
      }

      bookRoomExist.bkr_status = BookRoomStatus.NO_SHOW
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng xác nhận khách không đến',
          description: 'Nhà hàng đã đã xác nhận khách không đến nhận phòng',
          time: new Date()
        }
      ])
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'restaurantNoShowBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantNoShowBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantRefundDepositBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id });
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa');
      }

      if (![BookRoomStatus.CANCEL_GUEST, BookRoomStatus.NO_SHOW].includes(bookRoomExist.bkr_status)) {
        throw new BadRequestError("Nhà hàng chỉ có thể hoàn tiền khi khách hủy hoặc không đến");
      }

      bookRoomExist.bkr_status = BookRoomStatus.RESTAURANT_REFUND_DEPOSIT;
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng xác nhận hoàn tiền',
          description: 'Nhà hàng đã xác nhận hoàn tiền toàn bộ cho khách hàng',
          time: new Date()
        }
      ]);
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist;
    } catch (error) {
      saveLogSystem({
        action: 'restaurantRefundDepositBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantRefundDepositBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }



  }

  async restaurantRefundOneThirdDepositBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id });
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa');
      }

      if (![BookRoomStatus.CANCEL_GUEST, BookRoomStatus.NO_SHOW, BookRoomStatus.GUEST_EXCEPTION, BookRoomStatus.RESTAURANT_EXCEPTION].includes(bookRoomExist.bkr_status)) {
        throw new BadRequestError("Nhà hàng chỉ có thể hoàn tiền khi khách hủy hoặc không đến và ngoại lệ");
      }

      bookRoomExist.bkr_status = BookRoomStatus.RESTAURANT_REFUND_ONE_THIRD_DEPOSIT;
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng xác nhận hoàn tiền',
          description: 'Nhà hàng đã xác nhận hoàn tiền 1/3 cho khách hàng',
          time: new Date()
        }
      ]);
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist;
    } catch (error) {
      saveLogSystem({
        action: 'restaurantRefundOneThirdDepositBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantRefundOneThirdDepositBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }




  }

  async restaurantRefundOneTwoDepositBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id });
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa');
      }

      if (![BookRoomStatus.CANCEL_GUEST, BookRoomStatus.NO_SHOW, BookRoomStatus.GUEST_EXCEPTION, BookRoomStatus.RESTAURANT_EXCEPTION].includes(bookRoomExist.bkr_status)) {
        throw new BadRequestError("Nhà hàng chỉ có thể hoàn tiền khi khách hủy hoặc không đến và ngoại lệ");
      }

      bookRoomExist.bkr_status = BookRoomStatus.RESTAURANT_REFUND_ONE_TWO_DEPOSITE;
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng xác nhận hoàn tiền',
          description: 'Nhà hàng đã xác nhận hoàn tiền 2/3 cho khách hàng',
          time: new Date()
        }
      ]);
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist;
    } catch (error) {
      saveLogSystem({
        action: 'restaurantRefundOneTwoDepositBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantRefundOneTwoDepositBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantNoDepositBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id });
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa');
      }

      if (![BookRoomStatus.CANCEL_GUEST, BookRoomStatus.NO_SHOW, BookRoomStatus.GUEST_EXCEPTION, BookRoomStatus.RESTAURANT_EXCEPTION].includes(bookRoomExist.bkr_status)) {
        throw new BadRequestError("Nhà hàng chỉ có thể hoàn tiền khi khách hủy hoặc không đến và ngoại lệ");
      }

      bookRoomExist.bkr_status = BookRoomStatus.RESTAURANT_NO_DEPOSIT;
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng xác nhận hoàn tiền',
          description: 'Nhà hàng đã xác nhận không hoàn tiền cho khách hàng',
          time: new Date()
        }
      ]);
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist;
    } catch (error) {
      saveLogSystem({
        action: 'restaurantNoDepositBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantNoDepositBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantCheckOutBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.IN_USE) {
        throw new BadRequestError("Nhà hàng chưa xác nhận khách sử dụng phòng")
      }

      bookRoomExist.bkr_status = BookRoomStatus.GUEST_CHECK_OUT
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng xác nhận khách đã trả phòng',
          description: 'Nhà hàng đã đã xác nhận khách đã trả phòng',
          time: new Date()
        }
      ])
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'restaurantCheckOutBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantCheckOutBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantCheckOutOvertimeBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.IN_USE) {
        throw new BadRequestError("Nhà hàng chưa xác nhận khách sử dụng phòng")
      }

      bookRoomExist.bkr_status = BookRoomStatus.GUEST_CHECK_OUT_OVERTIME
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng xác nhận khách đã trả phòng',
          description: 'Nhà hàng đã đã xác nhận khách đã trả phòng quá giờ',
          time: new Date()
        }
      ])
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'restaurantCheckOutOvertimeBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantCheckOutOvertimeBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantConfirmPaymentBookRoom(bkr_id: string, bkr_plus_price: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.GUEST_CHECK_OUT && bookRoomExist.bkr_status !== BookRoomStatus.GUEST_CHECK_OUT_OVERTIME) {
        throw new BadRequestError("Nhà hàng chưa xác nhận khách đã trả phòng")
      }

      bookRoomExist.bkr_status = BookRoomStatus.RESTAURANT_CONFIRM_PAYMENT
      bookRoomExist.bkr_plus_price = Number(bkr_plus_price)
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng xác nhận thanh toán',
          description: `Nhà hàng đã đã xác nhận khách đã thanh toán cho nhà hàng`,
          time: new Date()
        }
      ])
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'restaurantConfirmPaymentBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantConfirmPaymentBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }

  }

  async guestExceptionBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      bookRoomExist.bkr_status = BookRoomStatus.GUEST_EXCEPTION
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Khách hàng đã xảy ra sự cố ngoài ý muốn',
          description: 'Khách hàng đã xảy ra sự cố ngoài ý muốn, vui lòng liên hệ với khách hàng để biết thêm chi tiết',
          time: new Date()
        }
      ])
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'guestExceptionBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'guestExceptionBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantExceptionBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      bookRoomExist.bkr_status = BookRoomStatus.RESTAURANT_EXCEPTION
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng đã xảy ra sự cố ngoài ý muốn',
          description: 'Nhà hàng đã xảy ra sự cố ngoài ý muốn, vui lòng liên hệ với nhà hàng để biết thêm chi tiết',
          time: new Date()
        }
      ])
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'restaurantExceptionBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantExceptionBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async guestComplaintBookRoom(bkr_id: string): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.RESTAURANT_CONFIRM_PAYMENT) {
        throw new BadRequestError("Nhà hàng chưa xác nhận thanh toán")
      }

      bookRoomExist.bkr_status = BookRoomStatus.GUEST_COMPLAINT
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Khách hàng yêu cầu khiếu nại',
          description: 'Khách hàng đã yêu cầu khiếu nại về dịch vụ của nhà hàng',
          time: new Date()
        }
      ])
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'guestComplaintBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'guestComplaintBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async doneComplaintBookRoom(bkr_id: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.GUEST_COMPLAINT) {
        throw new BadRequestError("Khách hàng chưa yêu cầu khiếu nại")
      }

      bookRoomExist.bkr_status = BookRoomStatus.DONE_COMPLAINT
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng đã xử lý khiếu nại',
          description: 'Nhà hàng đã xử lý khiếu nại của khách hàng',
          time: new Date()
        }
      ])
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'doneComplaintBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'doneComplaintBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async guestFeedbackBookRoom(bkr_id: string, bkr_feedback: string, bkr_star: 1 | 2 | 3 | 4 | 5): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.RESTAURANT_CONFIRM_PAYMENT) {
        throw new BadRequestError("Nhà hàng chưa xác nhận thanh toán")
      }

      bookRoomExist.bkr_feedback = bkr_feedback
      bookRoomExist.bkr_star = bkr_star
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Khách hàng phản hồi',
          description: 'Khách hàng đã phản hồi về dịch vụ của nhà hàng',
          time: new Date()
        }
      ])
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'guestFeedbackBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'guestFeedbackBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restaurantFeedbackBookRoom(bkr_id: string, bkr_reply: string, account: IAccount): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.RESTAURANT_CONFIRM_PAYMENT && bookRoomExist.bkr_feedback) {
        throw new BadRequestError("Nhà hàng chưa xác nhận thanh toán hoặc khách hàng chưa đánh giá")
      }

      bookRoomExist.bkr_reply = bkr_reply
      bookRoomExist.bkr_detail_history = JSON.stringify([
        ...JSON.parse(bookRoomExist.bkr_detail_history),
        {
          type: 'Nhà hàng phản hồi',
          description: 'Nhà hàng đã phản hồi về đanh giá của khách hàng',
          time: new Date()
        }
      ])
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'restaurantFeedbackBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'restaurantFeedbackBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }

  }

  async addMenuItemsToBookRoom(bkr_id: string, menu_items: {
    menu_id: string,
    bkr_menu_quantity: number
  }[], account: IAccount): Promise<BookRoomEntity> {
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.IN_USE) {
        throw new BadRequestError("Nhà hàng chưa xác nhận khách sử dụng phòng")
      }

      await Promise.all(
        menu_items.map(async (menu) => {
          const menuExist = await queryRunner.manager.findOne(MenuItemsEntity, {
            where: {
              mitems_id: menu.menu_id,
              mitems_res_id: account.account_restaurant_id,
              mitems_status: 'enable'
            }
          })

          if (!menuExist) {
            throw new BadRequestError('Món ăn không tồn tại hoặc đã bị xóa')
          }

          await queryRunner.manager.save(MenuItemsSnapEntity, {
            mitems_snap_res_id: account.account_restaurant_id,
            mitems_snap_bkr_id: bookRoomExist.bkr_id,
            mitems_snap_name: menuExist.mitems_name,
            mitems_snap_price: menuExist.mitems_price,
            mitems_snap_image: menuExist.mitems_image,
            mitems_snap_note: menuExist.mitems_note,
            mitems_snap_description: menuExist.mitems_description,
            mitems_snap_quantity: menu.bkr_menu_quantity
          })
        })
      )

      await queryRunner.commitTransaction()
      return bookRoomExist
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'addMenuItemsToBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'addMenuItemsToBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async addAmenitiesToBookRoom(bkr_id: string, amenities: {
    ame_id: string,
    bkr_ame_quantity: number
  }[], account: IAccount): Promise<BookRoomEntity> {
    //chỉ được thêm khi in_use, sử dụng transaction
    const queryRunner = this.dataSource.createQueryRunner()
    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id, bkr_res_id: account.account_restaurant_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      if (bookRoomExist.bkr_status !== BookRoomStatus.IN_USE) {
        throw new BadRequestError("Nhà hàng chưa xác nhận khách sử dụng phòng")
      }

      await Promise.all(
        amenities.map(async (ame) => {
          const ameExist = await queryRunner.manager.findOne(AmenitiesEntity, {
            where: {
              ame_id: ame.ame_id,
              ame_res_id: account.account_restaurant_id,
              ame_status: 'enable'
            }
          })

          if (!ameExist) {
            throw new BadRequestError('Dịch vụ không tồn tại hoặc đã bị xóa')
          }

          await queryRunner.manager.save(AmenitiesSnapEntity, {
            ame_snap_res_id: account.account_restaurant_id,
            ame_snap_bkr_id: bookRoomExist.bkr_id,
            ame_snap_name: ameExist.ame_name,
            ame_snap_price: ameExist.ame_price,
            ame_snap_note: ameExist.ame_note,
            ame_snap_description: ameExist.ame_description,
            ame_snap_quantity: ame.bkr_ame_quantity
          })
        })
      )

      await queryRunner.commitTransaction()
      return bookRoomExist
    } catch (error) {
      await queryRunner.rollbackTransaction()
      saveLogSystem({
        action: 'addAmenitiesToBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'addAmenitiesToBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getListBookRoomRestauarntPagination({
    bkr_status, fromDate, keyword, toDate, pageIndex, pageSize,
  }: {
    pageSize?: number
    pageIndex: number
    keyword: string
    bkr_status: string
    toDate: string
    fromDate: string
  }, account: IAccount): Promise<ResultPagination<BookRoomEntity>> {
    try {
      const commonConditions: any = {
        bkr_res_id: account.account_restaurant_id
      }

      if (bkr_status !== 'all') {
        commonConditions.bkr_status = bkr_status
      }

      if (fromDate || toDate) {
        const from = fromDate ? new Date(fromDate) : null
        const to = toDate ? new Date(toDate) : null

        if (from && to && !isNaN(from.getTime()) && !isNaN(to.getTime())) {
          const start = from < to ? from : to
          const end = from < to ? to : from
          commonConditions.bkr_created_at = Between(start, end)
        } else if (from && !isNaN(from.getTime())) {
          commonConditions.bkr_created_at = MoreThanOrEqual(from)
        } else if (to && !isNaN(to.getTime())) {
          commonConditions.bkr_created_at = LessThanOrEqual(to)
        }
      }

      let where: any

      if (keyword) {
        const likeKeyword = Like(`%${keyword}%`)
        where = [
          { ...commonConditions, bkr_email: likeKeyword },
          { ...commonConditions, bkr_phone: likeKeyword },
          { ...commonConditions, bkr_ame: likeKeyword }
        ]
      } else {
        where = commonConditions
      }

      const [bookRooms, total] = await this.bookRoomRepo.findAndCount({
        where,
        order: {
          bkr_created_at: 'DESC'
        },
        skip: (pageIndex - 1) * pageSize,
        take: pageSize,
        relations: ['menuItems', 'amenities']
      })


      const totalPage = Math.ceil(total / pageSize)
      const result: ResultPagination<BookRoomEntity> = {
        meta: {
          current: pageIndex,
          pageSize,
          totalItem: total,
          totalPage
        },
        result: bookRooms
      }

      return result
    } catch (error) {
      saveLogSystem({
        action: 'getListBookRoomRestauarntPagination',
        error: error,
        class: 'BookRoomService',
        function: 'getListBookRoomRestauarntPagination',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getListBookRoomGuestPagination({
    bkr_status, fromDate, keyword, toDate, pageIndex, pageSize,
  }: {
    pageSize?: number
    pageIndex: number
    keyword: string
    bkr_status: string
    toDate: string
    fromDate: string
  }, bkr_guest_id: string): Promise<ResultPagination<BookRoomEntity>> {
    try {
      const commonConditions: any = {
        bkr_guest_id: bkr_guest_id
      }

      if (bkr_status !== 'all') {
        commonConditions.bkr_status = bkr_status
      }

      if (fromDate || toDate) {
        const from = fromDate ? new Date(fromDate) : null
        const to = toDate ? new Date(toDate) : null

        if (from && to && !isNaN(from.getTime()) && !isNaN(to.getTime())) {
          const start = from < to ? from : to
          const end = from < to ? to : from
          commonConditions.bkr_created_at = Between(start, end)
        } else if (from && !isNaN(from.getTime())) {
          commonConditions.bkr_created_at = MoreThanOrEqual(from)
        } else if (to && !isNaN(to.getTime())) {
          commonConditions.bkr_created_at = LessThanOrEqual(to)
        }
      }

      let where: any

      if (keyword) {
        const likeKeyword = Like(`%${keyword}%`)
        where = [
          { ...commonConditions, bkr_email: likeKeyword },
          { ...commonConditions, bkr_phone: likeKeyword },
          { ...commonConditions, bkr_ame: likeKeyword }
        ]
      } else {
        where = commonConditions
      }

      const [bookRooms, total] = await this.bookRoomRepo.findAndCount({
        where,
        order: {
          bkr_created_at: 'DESC'
        },
        skip: (pageIndex - 1) * pageSize,
        take: pageSize,
        relations: ['menuItems', 'amenities']
      })

      const totalPage = Math.ceil(total / pageSize)
      const result: ResultPagination<BookRoomEntity> = {
        meta: {
          current: pageIndex,
          pageSize,
          totalItem: total,
          totalPage
        },
        result: bookRooms
      }

      return result
    } catch (error) {
      saveLogSystem({
        action: 'getListBookRoomGuestPagination',
        error: error,
        class: 'BookRoomService',
        function: 'getListBookRoomGuestPagination',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateFeedViewBookRoom(bkr_id: string, bkr_feed_view: 'active' | 'disable'): Promise<BookRoomEntity> {
    try {
      const bookRoomExist = await this.bookRoomRepo.findOneBy({ bkr_id })
      if (!bookRoomExist) {
        throw new BadRequestError('Đặt phòng không tồn tại hoặc đã bị xóa')
      }

      bookRoomExist.bkr_feed_view = bkr_feed_view
      await this.bookRoomRepo.save(bookRoomExist)
      return bookRoomExist
    } catch (error) {
      saveLogSystem({
        action: 'updateFeedViewBookRoom',
        error: error,
        class: 'BookRoomService',
        function: 'updateFeedViewBookRoom',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getListFeedbackBookRoomRestaurantPagination({
    pageIndex,
    pageSize,
    star,
    restaurant_id
  }: {
    pageIndex: number
    pageSize: number
    star: string
    restaurant_id: string
  }): Promise<{
    meta: {
      pageIndex: number
      pageSize: number
      totalPage: number
      totalItem: number
    }
    result: BookRoomEntity[]
  }> {
    try {
      const query: any = {
        bkr_res_id: restaurant_id,
        bkr_feed_view: 'active',
      }

      if (star && star !== '0') {
        query.bkr_star = Number(star)
      }

      const [bookRooms, total] = await this.bookRoomRepo.findAndCount({
        where: query,
        order: {
          bkr_created_at: 'DESC'
        },
        skip: (pageIndex - 1) * pageSize,
        take: pageSize,
        select: ['bkr_feedback', 'bkr_reply', 'bkr_star']
      })

      const totalPage = Math.ceil(total / pageSize)
      const result: {
        meta: {
          pageIndex: number
          pageSize: number
          totalItem: number
          totalPage: number
        }
        result: BookRoomEntity[]
      } = {
        meta: {
          pageIndex: pageIndex,
          pageSize,
          totalItem: total,
          totalPage
        },
        result: bookRooms
      }

      return result
    } catch (error) {
      saveLogSystem({
        action: 'getListFeedbackBookRoomRestaurantPagination',
        error: error,
        class: 'BookRoomService',
        function: 'getListFeedbackBookRoomRestaurantPagination',
        message: error.message,
        time: new Date(),
        type: 'error',
      })
      throw new ServerErrorDefault(error)
    }
  }
}