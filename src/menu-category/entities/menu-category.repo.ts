import { Repository, UpdateResult } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { addDocToElasticsearch, deleteAllDocByElasticsearch, indexElasticsearchExists } from 'src/utils/elasticsearch'
import { MENU_CATEGORY_ELASTICSEARCH_INDEX } from 'src/constants/index.elasticsearch'
import { ConfigService } from '@nestjs/config'
import { Injectable, OnModuleInit } from '@nestjs/common'
import { saveLogSystem } from 'src/log/sendLog.els'
import { ServerErrorDefault } from 'src/utils/errorResponse'
import { IAccount } from 'src/guard/interface/account.interface'
import { MenuCategoryEntity } from './menu-category.entity'
import { UpdateStatusMenuCategoryDto } from '../dto/update-status-menu-category.dto'

@Injectable()
export class MenuCategoryRepo implements OnModuleInit {
  constructor(
    @InjectRepository(MenuCategoryEntity)
    private readonly menuCategoryRepository: Repository<MenuCategoryEntity>,
    private readonly configService: ConfigService
  ) { }

  async onModuleInit() {
    const isSync = this.configService.get('SYNC_MONGODB_TO_ELASTICSEARCH')
    if (isSync !== '1') {
      return
    }
    const result: MenuCategoryEntity[] = await this.menuCategoryRepository.find()
    const indexExist = await indexElasticsearchExists(MENU_CATEGORY_ELASTICSEARCH_INDEX)
    if (indexExist) {
      await deleteAllDocByElasticsearch(MENU_CATEGORY_ELASTICSEARCH_INDEX)
    }
    for (const doc of result) {
      await addDocToElasticsearch(MENU_CATEGORY_ELASTICSEARCH_INDEX, doc.mcat_id.toString(), doc)
    }
  }

  async createMenuCategory(menuCategory: MenuCategoryEntity): Promise<MenuCategoryEntity> {
    try {
      return this.menuCategoryRepository.save(menuCategory)
    } catch (error) {
      saveLogSystem({
        action: 'createMenuCategory',
        class: 'MenuCategoryRepo',
        function: 'createMenuCategory',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateMenuCategory(menuCategory: MenuCategoryEntity): Promise<UpdateResult> {
    try {
      return await this.menuCategoryRepository
        .createQueryBuilder()
        .update(MenuCategoryEntity)
        .set({
          mcat_name: menuCategory.mcat_name,
          mcat_description: menuCategory.mcat_description,
          updatedBy: menuCategory.updatedBy,
          mcat_id: menuCategory.mcat_id
        })
        .where({
          mcat_id: menuCategory.mcat_id,
          mcat_res_id: menuCategory.mcat_res_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateMenuCategory',
        class: 'MenuCategoryRepo',
        function: 'updateMenuCategory',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async deleteMenuCategory(mcat_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      return await this.menuCategoryRepository
        .createQueryBuilder()
        .update(MenuCategoryEntity)
        .set({
          isDeleted: 1,
          mcat_id: mcat_id,
          deletedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: new Date()
        })
        .where({
          mcat_id: mcat_id,
          mcat_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'deleteMenuCategory',
        class: 'MenuCategoryRepo',
        function: 'deleteMenuCategory',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async restoreMenuCategory(mcat_id: string, account: IAccount): Promise<UpdateResult> {
    try {
      return await this.menuCategoryRepository
        .createQueryBuilder()
        .update(MenuCategoryEntity)
        .set({
          isDeleted: 0,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
          deletedAt: null,
          deletedBy: null,
          mcat_id: mcat_id
        })
        .where({
          mcat_id: mcat_id,
          mcat_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'restoreMenuCategory',
        class: 'MenuCategoryRepo',
        function: 'restoreMenuCategory',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateStatusMenuCategory(
    updateStatusMenuCategoryDto: UpdateStatusMenuCategoryDto,
    account: IAccount
  ): Promise<UpdateResult> {
    try {
      return await this.menuCategoryRepository
        .createQueryBuilder()
        .update(MenuCategoryEntity)
        .set({
          mcat_status: updateStatusMenuCategoryDto.mcat_status,
          mcat_id: updateStatusMenuCategoryDto.mcat_id,
          updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
        })
        .where({
          mcat_id: updateStatusMenuCategoryDto.mcat_id,
          mcat_res_id: account.account_restaurant_id
        })
        .execute()
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusMenuCategory',
        class: 'MenuCategoryRepo',
        function: 'updateStatusMenuCategory',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
