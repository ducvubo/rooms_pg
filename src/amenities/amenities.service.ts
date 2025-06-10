import { Injectable } from '@nestjs/common'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { AmenitiesRepo } from './entities/amenities.repo'
import { AmenitiesQuery } from './entities/amenities.query'
import { CreateAmenitiesDto } from './dto/create-amenities.dto'
import { AmenitiesEntity } from './entities/amenities.entity'
import { UpdateAmenitiesDto } from './dto/update-amenities.dto'
import { UpdateStatusAmenitiesDto } from './dto/update-status-amenities.dto'
import { sendMessageToKafka } from 'src/utils/kafka'
import { deleteCacheIO, getCacheIO, setCacheIO } from 'src/utils/cache'
import { KEY_LIST_AMENITIES_RESTAURANT } from 'src/constants/key.redis'


@Injectable()
export class AmenitiesService {
  constructor(
    private readonly amenitiesRepo: AmenitiesRepo,
    private readonly amenitiesQuery: AmenitiesQuery
  ) { }

  async createAmenities(
    createAmenitiesDto: CreateAmenitiesDto,
    account: IAccount
  ): Promise<AmenitiesEntity> {
    try {
      const ame = await this.amenitiesRepo.createAmenities({
        ame_name: createAmenitiesDto.ame_name,
        ame_price: createAmenitiesDto.ame_price,
        ame_note: createAmenitiesDto.ame_note,
        ame_description: createAmenitiesDto.ame_description,
        ame_res_id: account.account_restaurant_id,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Tiện ích phòng ${createAmenitiesDto.ame_name} vừa được tạo mới`,
          noti_title: `Tiện ích phòng`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      // Xóa cache khi tạo mới tiện ích
      await deleteCacheIO(`${KEY_LIST_AMENITIES_RESTAURANT}:${account.account_restaurant_id}`)

      return ame
    } catch (error) {
      saveLogSystem({
        action: 'createAmenities',
        class: 'AmenitiesService',
        function: 'createAmenities',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(ame_id: string, account: IAccount): Promise<AmenitiesEntity | null> {
    try {
      return this.amenitiesQuery.findOneById(ame_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'AmenitiesService',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateAmenities(updateAmenitiesDto: UpdateAmenitiesDto, account: IAccount): Promise<UpdateResult> {
    try {
      const amenitiesExist = await this.amenitiesQuery.findOneById(updateAmenitiesDto.ame_id, account)
      if (!amenitiesExist) {
        throw new BadRequestError('Danh mục menu không tồn tại')
      }
      const update = await this.amenitiesRepo.updateAmenities({
        ame_name: updateAmenitiesDto.ame_name,
        ame_price: updateAmenitiesDto.ame_price,
        ame_note: updateAmenitiesDto.ame_note,
        ame_description: updateAmenitiesDto.ame_description,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        ame_res_id: account.account_restaurant_id,
        ame_id: updateAmenitiesDto.ame_id
      })

      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Tiện ích phòng ${updateAmenitiesDto.ame_name} vừa được cập nhật`,
          noti_title: `Tiện ích phòng`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })

      await deleteCacheIO(`${KEY_LIST_AMENITIES_RESTAURANT}:${account.account_restaurant_id}`)

      return update

    } catch (error) {
      saveLogSystem({
        action: 'updateAmenities',
        class: 'AmenitiesService',
        function: 'updateAmenities',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteAmenities(ame_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const amenitiesExist = await this.amenitiesQuery.findOneById(ame_id, account)
      if (!amenitiesExist) {
        throw new BadRequestError('Danh mục menu không tồn tại')
      }
      const deleted = await this.amenitiesRepo.deleteAmenities(ame_id, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Tiện ích phòng ${amenitiesExist.ame_name} vừa được xóa`,
          noti_title: `Tiện ích phòng`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      await deleteCacheIO(`${KEY_LIST_AMENITIES_RESTAURANT}:${account.account_restaurant_id}`)
      return deleted
    } catch (error) {
      saveLogSystem({
        action: 'deleteAmenities',
        class: 'AmenitiesService',
        function: 'deleteAmenities',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreAmenities(ame_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      const amenitiesExist = await this.amenitiesQuery.findOneById(ame_id, account)
      if (!amenitiesExist) {
        throw new BadRequestError('Danh mục menu không tồn tại')
      }
      const restore = await this.amenitiesRepo.restoreAmenities(ame_id, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Tiện ích phòng ${amenitiesExist.ame_name} vừa được khôi phục`,
          noti_title: `Tiện ích phòng`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      await deleteCacheIO(`${KEY_LIST_AMENITIES_RESTAURANT}:${account.account_restaurant_id}`)
      return restore
    } catch (error) {
      saveLogSystem({
        action: 'restoreAmenities',
        class: 'AmenitiesService',
        function: 'restoreAmenities',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusAmenities(
    updateStatusAmenitiesDto: UpdateStatusAmenitiesDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      const amenitiesExist = await this.amenitiesQuery.findOneById(
        updateStatusAmenitiesDto.ame_id,
        account
      )
      if (!amenitiesExist) {
        throw new BadRequestError('Danh mục menu không tồn tại')
      }
      const update = await this.amenitiesRepo.updateStatusAmenities(updateStatusAmenitiesDto, account)
      sendMessageToKafka({
        topic: 'NOTIFICATION_ACCOUNT_CREATE',
        message: JSON.stringify({
          restaurantId: account.account_restaurant_id,
          noti_content: `Tiện ích phòng ${amenitiesExist.ame_name} vừa được cập nhật trạng thái`,
          noti_title: `Tiện ích phòng`,
          noti_type: 'table',
          noti_metadata: JSON.stringify({ text: 'test' }),
          sendObject: 'all_account'
        })
      })
      await deleteCacheIO(`${KEY_LIST_AMENITIES_RESTAURANT}:${account.account_restaurant_id}`)
      return update
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusAmenities',
        class: 'AmenitiesService',
        function: 'updateStatusAmenities',
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
      ame_name
    }: {
      pageSize: number
      pageIndex: number
      ame_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<AmenitiesEntity>> {
    try {
      if (!ame_name && typeof ame_name !== 'string') {
        throw new BadRequestError('Danh mục menu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataAmenities = await this.amenitiesQuery.findAllPagination(
        { pageSize, pageIndex, ame_name, isDeleted: 0 },
        account
      )

      return dataAmenities
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'AmenitiesService',
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
      ame_name
    }: {
      pageSize: number
      pageIndex: number
      ame_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<AmenitiesEntity>> {
    try {
      if (!ame_name && typeof ame_name !== 'string') {
        throw new BadRequestError('Danh mục menu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataAmenities = await this.amenitiesQuery.findAllPagination(
        { pageSize, pageIndex, ame_name, isDeleted: 1 },
        account
      )

      return dataAmenities
    } catch (error) {
      saveLogSystem({
        action: 'findAllRecycle',
        class: 'AmenitiesService',
        function: 'findAllRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllAmenitiesName(account: IAccount): Promise<AmenitiesEntity[]> {
    try {
      return this.amenitiesQuery.findAllAmenitiesName(account)
    } catch (error) {
      saveLogSystem({
        action: 'findAllAmenitiesName',
        class: 'AmenitiesService',
        function: 'findAllAmenitiesName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllAmenitiesByResId({ ame_res_id }: { ame_res_id: string }): Promise<AmenitiesEntity[]> {
    try {
      const listAme = await getCacheIO(`${KEY_LIST_AMENITIES_RESTAURANT}:${ame_res_id}`)
      if (listAme) {
        console.log('Data amenities from cache')
        return listAme
      };
      const data = await this.amenitiesQuery.getAmenitiesByRestaurantId({ ame_res_id })
      setCacheIO(`${KEY_LIST_AMENITIES_RESTAURANT}:${ame_res_id}`, data)
      console.log('Data amenities from database')
      return data
    } catch (error) {
      saveLogSystem({
        action: 'findAllAmenitiesByResId',
        class: 'AmenitiesService',
        function: 'findAllAmenitiesByResId',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
