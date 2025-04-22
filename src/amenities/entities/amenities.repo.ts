import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IAccount } from 'src/guard/interface/account.interface'
import { AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { AmenitiesEntity } from './amenities.entity'
import { UpdateStatusAmenitiesDto } from '../dto/update-status-amenities.dto'

@Injectable()
export class AmenitiesRepo implements OnModuleInit {
  constructor(
    @InjectRepository(AmenitiesEntity)
    private readonly amenitiesRepository: Repository<AmenitiesEntity>,
    private readonly configService: ConfigService
  ) { }

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: AmenitiesEntity[] = await this.amenitiesRepository.find()
    const indexExist = await indexElasticsearchExists(AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(AMENITIES_BOOK_ROOM_ELASTICSEARCH_INDEX, doc.ame_id.toString(), doc)
    }
  }

  async createAmenities(amenities: AmenitiesEntity): Promise<AmenitiesEntity> {
    try {
      return this.amenitiesRepository.save(amenities)
    } catch (error) {
      saveLogSystem({
        action: 'createAmenities',
        class: 'AmenitiesRepo',
        function: 'createAmenities',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateAmenities(amenities: AmenitiesEntity): Promise<UpdateResult> {
    try {
      return await this.amenitiesRepository
        .createQueryBuilder()
        .update(AmenitiesEntity)
        .set({
          ame_name: amenities.ame_name,
          ame_price: amenities.ame_price,
          ame_note: amenities.ame_note,
          ame_description: amenities.ame_description,
          updatedBy: amenities.updatedBy,
          ame_id: amenities.ame_id
        })
        .where({
          ame_id: amenities.ame_id,
          ame_res_id: amenities.ame_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateAmenities',
        class: 'AmenitiesRepo',
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
      return await this.amenitiesRepository
        .createQueryBuilder()
        .update(AmenitiesEntity)
        .set({
          isDeleted: 1,
          ame_id: ame_id,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: new Date()
        })
        .where({
          ame_id: ame_id,
          ame_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'deleteAmenities',
        class: 'AmenitiesRepo',
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
      return await this.amenitiesRepository
        .createQueryBuilder()
        .update(AmenitiesEntity)
        .set({
          isDeleted: 0,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: null,
          deletedBy: null,
          ame_id: ame_id
        })
        .where({
          ame_id: ame_id,
          ame_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'restoreAmenities',
        class: 'AmenitiesRepo',
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
      return await this.amenitiesRepository
        .createQueryBuilder()
        .update(AmenitiesEntity)
        .set({
          ame_status: updateStatusAmenitiesDto.ame_status,
          ame_id: updateStatusAmenitiesDto.ame_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          ame_id: updateStatusAmenitiesDto.ame_id,
          ame_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusAmenities',
        class: 'AmenitiesRepo',
        function: 'updateStatusAmenities',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
