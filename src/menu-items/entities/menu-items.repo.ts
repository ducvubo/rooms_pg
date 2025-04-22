import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IAccount } from 'src/guard/interface/account.interface'
import { MenuItemsEntity } from './menu-items.entity'
import { MENU_ITEMS_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { UpdateStatusMenuItemsDto } from '../dto/update-status-menu-items.dto'

@Injectable()
export class MenuItemsRepo implements OnModuleInit {
  constructor(
    @InjectRepository(MenuItemsEntity)
    private readonly menuItemsRepository: Repository<MenuItemsEntity>,
    private readonly configService: ConfigService
  ) { }

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: MenuItemsEntity[] = await this.menuItemsRepository.find()
    const indexExist = await indexElasticsearchExists(MENU_ITEMS_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(MENU_ITEMS_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(MENU_ITEMS_ELASTICSEARCH_INDEX, doc.mitems_id.toString(), doc)
    }
  }

  async createMenuItems(menuItems: MenuItemsEntity): Promise<MenuItemsEntity> {
    try {
      return this.menuItemsRepository.save(menuItems)
    } catch (error) {
      saveLogSystem({
        action: 'createMenuItems',
        class: 'MenuItemsRepo',
        function: 'createMenuItems',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateMenuItems(menuItems: MenuItemsEntity): Promise<UpdateResult> {
    try {
      return await this.menuItemsRepository
        .createQueryBuilder()
        .update(MenuItemsEntity)
        .set({
          mitems_name: menuItems.mitems_name,
          mitems_price: menuItems.mitems_price,
          mitems_image: menuItems.mitems_image,
          mitems_note: menuItems.mitems_note,
          mitems_description: menuItems.mitems_description,
          updatedBy: menuItems.updatedBy,
          mitems_id: menuItems.mitems_id
        })
        .where({
          mitems_id: menuItems.mitems_id,
          mitems_res_id: menuItems.mitems_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateMenuItems',
        class: 'MenuItemsRepo',
        function: 'updateMenuItems',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteMenuItems(mitems_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      return await this.menuItemsRepository
        .createQueryBuilder()
        .update(MenuItemsEntity)
        .set({
          isDeleted: 1,
          mitems_id: mitems_id,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: new Date()
        })
        .where({
          mitems_id: mitems_id,
          mitems_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'deleteMenuItems',
        class: 'MenuItemsRepo',
        function: 'deleteMenuItems',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreMenuItems(mitems_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      return await this.menuItemsRepository
        .createQueryBuilder()
        .update(MenuItemsEntity)
        .set({
          isDeleted: 0,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: null,
          deletedBy: null,
          mitems_id: mitems_id
        })
        .where({
          mitems_id: mitems_id,
          mitems_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'restoreMenuItems',
        class: 'MenuItemsRepo',
        function: 'restoreMenuItems',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusMenuItems(
    updateStatusMenuItemsDto: UpdateStatusMenuItemsDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      return await this.menuItemsRepository
        .createQueryBuilder()
        .update(MenuItemsEntity)
        .set({
          mitems_status: updateStatusMenuItemsDto.mitems_status,
          mitems_id: updateStatusMenuItemsDto.mitems_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          mitems_id: updateStatusMenuItemsDto.mitems_id,
          mitems_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusMenuItems',
        class: 'MenuItemsRepo',
        function: 'updateStatusMenuItems',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
