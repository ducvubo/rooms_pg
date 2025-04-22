import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { ROOMS_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IAccount } from 'src/guard/interface/account.interface'
import { RoomsEntity } from './rooms.entity'
import { UpdateStatusRoomsDto } from '../dto/update-status-rooms.dto'

@Injectable()
export class RoomsRepo implements OnModuleInit {
  constructor(
    @InjectRepository(RoomsEntity)
    private readonly roomsRepository: Repository<RoomsEntity>,
    private readonly configService: ConfigService
  ) { }

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: RoomsEntity[] = await this.roomsRepository.find()
    const indexExist = await indexElasticsearchExists(ROOMS_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(ROOMS_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(ROOMS_ELASTICSEARCH_INDEX, doc.room_id.toString(), doc)
    }
  }

  async createRooms(rooms: RoomsEntity): Promise<RoomsEntity> {
    try {
      return this.roomsRepository.save(rooms)
    } catch (error) {
      saveLogSystem({
        action: 'createRooms',
        class: 'RoomsRepo',
        function: 'createRooms',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateRooms(rooms: RoomsEntity): Promise<UpdateResult> {
    try {
      return await this.roomsRepository
        .createQueryBuilder()
        .update(RoomsEntity)
        .set({
          room_name: rooms.room_name,
          room_fix_ame: rooms.room_fix_ame,
          room_max_guest: rooms.room_max_guest,
          room_base_price: rooms.room_base_price,
          room_note: rooms.room_note,
          room_images: rooms.room_images,
          room_description: rooms.room_description,
          updatedBy: rooms.updatedBy,
          room_id: rooms.room_id
        })
        .where({
          room_id: rooms.room_id,
          room_res_id: rooms.room_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateRooms',
        class: 'RoomsRepo',
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
      return await this.roomsRepository
        .createQueryBuilder()
        .update(RoomsEntity)
        .set({
          isDeleted: 1,
          room_id: room_id,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: new Date()
        })
        .where({
          room_id: room_id,
          room_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'deleteRooms',
        class: 'RoomsRepo',
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
      return await this.roomsRepository
        .createQueryBuilder()
        .update(RoomsEntity)
        .set({
          isDeleted: 0,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: null,
          deletedBy: null,
          room_id: room_id
        })
        .where({
          room_id: room_id,
          room_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'restoreRooms',
        class: 'RoomsRepo',
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
      return await this.roomsRepository
        .createQueryBuilder()
        .update(RoomsEntity)
        .set({
          room_status: updateStatusRoomsDto.room_status,
          room_id: updateStatusRoomsDto.room_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          room_id: updateStatusRoomsDto.room_id,
          room_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusRooms',
        class: 'RoomsRepo',
        function: 'updateStatusRooms',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
