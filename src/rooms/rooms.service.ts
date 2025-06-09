import { Injectable } from '@nestjs/common'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { RoomsRepo } from './entities/rooms.repo'
import { RoomsQuery } from './entities/rooms.query'
import { CreateRoomsDto } from './dto/create-rooms.dto'
import { RoomsEntity } from './entities/rooms.entity'
import { UpdateRoomsDto } from './dto/update-rooms.dto'
import { UpdateStatusRoomsDto } from './dto/update-status-rooms.dto'
import { sendMessageToKafka } from 'src/utils/kafka'
import { KEY_HOME_PAGE_LIST_ROOM } from 'src/constants/key.redis'
import { deleteCacheIO, getCacheIO, setCacheIO } from 'src/utils/cache'

@Injectable()
export class RoomsService {
  constructor(
    private readonly roomsRepo: RoomsRepo,
    private readonly roomsQuery: RoomsQuery,
  ) { }

  async createRooms(
    createRoomsDto: CreateRoomsDto,
    account: IAccount
  ): Promise<RoomsEntity> {
    try {
      const room = await this.roomsRepo.createRooms({
        room_name: createRoomsDto.room_name,
        room_fix_ame: createRoomsDto.room_fix_ame,
        room_area: createRoomsDto.room_area,
        room_max_guest: createRoomsDto.room_max_guest,
        room_base_price: createRoomsDto.room_base_price,
        room_note: createRoomsDto.room_note,
        room_description: createRoomsDto.room_description,
        room_images: createRoomsDto.room_images,
        room_res_id: account.account_restaurant_id,
        room_deposit: createRoomsDto.room_deposit,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Phòng ${createRoomsDto.room_name} vừa được thêm mới`,
          noti_title: `Phòng`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      //xóa cache
      await deleteCacheIO(`${KEY_HOME_PAGE_LIST_ROOM}_${account.account_restaurant_id}`)
      return room

    } catch (error) {
      saveLogSystem({
        action: 'createRooms',
        class: 'RoomsService',
        function: 'createRooms',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(room_id: string, account: IAccount): Promise<RoomsEntity | null> {
    try {
      return this.roomsQuery.findOneById(room_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'RoomsService',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateRooms(updateRoomsDto: UpdateRoomsDto, account: IAccount): Promise<UpdateResult> {
    try {
      const roomsExist = await this.roomsQuery.findOneById(updateRoomsDto.room_id, account)
      if (!roomsExist) {
        throw new BadRequestError('Menu không tồn tại')
      }
      const update = await this.roomsRepo.updateRooms({
        room_name: updateRoomsDto.room_name,
        room_fix_ame: updateRoomsDto.room_fix_ame,
        room_max_guest: updateRoomsDto.room_max_guest,
        room_base_price: updateRoomsDto.room_base_price,
        room_note: updateRoomsDto.room_note,
        room_description: updateRoomsDto.room_description,
        room_images: updateRoomsDto.room_images,
        room_deposit: updateRoomsDto.room_deposit,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        room_res_id: account.account_restaurant_id,
        room_id: updateRoomsDto.room_id
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Phòng ${updateRoomsDto.room_name} vừa được cập nhật`,
          noti_title: `Phòng`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      await deleteCacheIO(`${KEY_HOME_PAGE_LIST_ROOM}_${account.account_restaurant_id}`)

      return update
    } catch (error) {
      saveLogSystem({
        action: 'updateRooms',
        class: 'RoomsService',
        function: 'updateRooms',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteRooms(room_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const roomsExist = await this.roomsQuery.findOneById(room_id, account)
      if (!roomsExist) {
        throw new BadRequestError('Menu không tồn tại')
      }
      const deleted = await this.roomsRepo.deleteRooms(room_id, account)

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Phòng ${roomsExist.room_name} vừa được xóa`,
          noti_title: `Phòng`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      await deleteCacheIO(`${KEY_HOME_PAGE_LIST_ROOM}_${account.account_restaurant_id}`)

      return deleted
    } catch (error) {
      saveLogSystem({
        action: 'deleteRooms',
        class: 'RoomsService',
        function: 'deleteRooms',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreRooms(room_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const roomsExist = await this.roomsQuery.findOneById(room_id, account)
      if (!roomsExist) {
        throw new BadRequestError('Menu không tồn tại')
      }
      const restore = await this.roomsRepo.restoreRooms(room_id, account)

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Phòng ${roomsExist.room_name} vừa được khôi phục`,
          noti_title: `Phòng`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      await deleteCacheIO(`${KEY_HOME_PAGE_LIST_ROOM}_${account.account_restaurant_id}`)

        return restore
    } catch (error) {
      saveLogSystem({
        action: 'restoreRooms',
        class: 'RoomsService',
        function: 'restoreRooms',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusRooms(
    updateStatusRoomsDto: UpdateStatusRoomsDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const roomsExist = await this.roomsQuery.findOneById(
        updateStatusRoomsDto.room_id,
        account
      )
      if (!roomsExist) {
        throw new BadRequestError('Menu không tồn tại')
      }
      const update = await this.roomsRepo.updateStatusRooms(updateStatusRoomsDto, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Phòng ${roomsExist.room_name} vừa được cập nhật trạng thái`,
          noti_title: `Phòng`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      await deleteCacheIO(`${KEY_HOME_PAGE_LIST_ROOM}_${account.account_restaurant_id}`)

      return update
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusRooms',
        class: 'RoomsService',
        function: 'updateStatusRooms',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAll(
    {
      pageSize,
      pageIndex,
      room_name
    }: {
      pageSize: number
      pageIndex: number
      room_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<RoomsEntity>> {
    try {
      if (!room_name && typeof room_name !== 'string') {
        throw new BadRequestError('Menu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataRooms = await this.roomsQuery.findAllPagination(
        { pageSize, pageIndex, room_name, isDeleted: 0 },
        account
      )

      return dataRooms
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'RoomsService',
        function: 'findAll',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllRecycle(
    {
      pageSize,
      pageIndex,
      room_name
    }: {
      pageSize: number
      pageIndex: number
      room_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<RoomsEntity>> {
    try {
      if (!room_name && typeof room_name !== 'string') {
        throw new BadRequestError('Menu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataRooms = await this.roomsQuery.findAllPagination(
        { pageSize, pageIndex, room_name, isDeleted: 1 },
        account
      )

      return dataRooms
    } catch (error) {
      saveLogSystem({
        action: 'findAllRecycle',
        class: 'RoomsService',
        function: 'findAllRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllItemsName(account: IAccount): Promise<RoomsEntity[]> {
    try {
      return this.roomsQuery.findAllRoomName(account)
    } catch (error) {
      saveLogSystem({
        action: 'findAllCatName',
        class: 'RoomsService',
        function: 'findAllCatName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getRoomsByRestaurantId({ room_res_id }: { room_res_id: string }): Promise<RoomsEntity[]> {
    try {
      const listRoom = await getCacheIO(`${KEY_HOME_PAGE_LIST_ROOM}_${room_res_id}`)
      if (listRoom) {
        console.log('Data from cache');
        return listRoom
      }
      const data = await this.roomsQuery.getRoomByRestaurantId({ room_res_id })
      await setCacheIO(`${KEY_HOME_PAGE_LIST_ROOM}_${room_res_id}`, data)
      console.log('Data from database');
      return data
    } catch (error) {
      saveLogSystem({
        action: 'getRoomsByRestaurantId',
        class: 'RoomsService',
        function: 'getRoomsByRestaurantId',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async getRoomById(room_id: string): Promise<RoomsEntity | null> {
    try {
      return this.roomsQuery.findOneInforById(room_id)
    } catch (error) {
      saveLogSystem({
        action: 'getRoomById',
        class: 'RoomsService',
        function: 'getRoomById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }


  async findAllPaginationListRoom({ pageSize, pageIndex }): Promise<{
    meta: {
      pageIndex: number
      pageSize: number
      totalPage: number
      totalItem: number
    }
    result: RoomsEntity[]
  }> {
    try {
      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataFood = await this.roomsQuery.findAllPaginationListRoom({ pageSize, pageIndex })

      if (!dataFood?.result.length) {
        return {
          meta: {
            pageIndex,
            pageSize,
            totalPage: 0,
            totalItem: 0
          },
          result: []
        }
      }

      return dataFood
    } catch (error) {
      saveLogSystem({
        action: 'findAllPaginationListRoom',
        class: 'RoomsService',
        function: 'findAllPaginationListRoom',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
