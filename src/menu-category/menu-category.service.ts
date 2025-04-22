import { Injectable } from '@nestjs/common'
import { MenuCategoryRepo } from './entities/menu-category.repo'
import { MenuCategoryQuery } from './entities/menu-category.query'
import { IAccount } from 'src/guard/interface/account.interface'
import { saveLogSystem } from 'src/log/sendLog.els'
import { BadRequestError, ServerErrorDefault } from 'src/utils/errorResponse'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto'
import { MenuCategoryEntity } from './entities/menu-category.entity'
import { UpdateStatusMenuCategoryDto } from './dto/update-status-menu-category.dto'
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto'

@Injectable()
export class MenuCategoryService {
  constructor(
    private readonly menuCategoryRepo: MenuCategoryRepo,
    private readonly menuCategoryQuery: MenuCategoryQuery
  ) { }

  async createMenuCategory(
    createMenuCategoryDto: CreateMenuCategoryDto,
    account: IAccount
  ): Promise<MenuCategoryEntity> {
    try {
      return this.menuCategoryRepo.createMenuCategory({
        mcat_name: createMenuCategoryDto.mcat_name,
        mcat_description: createMenuCategoryDto.mcat_description,
        mcat_res_id: account.account_restaurant_id,
        createdBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'createMenuCategory',
        class: 'MenuCategoryService',
        function: 'createMenuCategory',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findOneById(mcat_id: string, account: IAccount): Promise<MenuCategoryEntity | null> {
    try {
      return this.menuCategoryQuery.findOneById(mcat_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'findOneById',
        class: 'MenuCategoryService',
        function: 'findOneById',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async updateMenuCategory(updateMenuCategoryDto: UpdateMenuCategoryDto, account: IAccount): Promise<UpdateResult> {
    try {
      const menuCategoryExist = await this.menuCategoryQuery.findOneById(updateMenuCategoryDto.mcat_id, account)
      if (!menuCategoryExist) {
        throw new BadRequestError('Danh mục menu không tồn tại')
      }
      return this.menuCategoryRepo.updateMenuCategory({
        mcat_name: updateMenuCategoryDto.mcat_name,
        mcat_description: updateMenuCategoryDto.mcat_description,
        updatedBy: account.account_employee_id ? account.account_employee_id : account.account_restaurant_id,
        mcat_res_id: account.account_restaurant_id,
        mcat_id: updateMenuCategoryDto.mcat_id
      })
    } catch (error) {
      saveLogSystem({
        action: 'updateMenuCategory',
        class: 'MenuCategoryService',
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
      const menuCategoryExist = await this.menuCategoryQuery.findOneById(mcat_id, account)
      if (!menuCategoryExist) {
        throw new BadRequestError('Danh mục menu không tồn tại')
      }
      return this.menuCategoryRepo.deleteMenuCategory(mcat_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'deleteMenuCategory',
        class: 'MenuCategoryService',
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
      const menuCategoryExist = await this.menuCategoryQuery.findOneById(mcat_id, account)
      if (!menuCategoryExist) {
        throw new BadRequestError('Danh mục menu không tồn tại')
      }
      return this.menuCategoryRepo.restoreMenuCategory(mcat_id, account)
    } catch (error) {
      saveLogSystem({
        action: 'restoreMenuCategory',
        class: 'MenuCategoryService',
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
      const menuCategoryExist = await this.menuCategoryQuery.findOneById(
        updateStatusMenuCategoryDto.mcat_id,
        account
      )
      if (!menuCategoryExist) {
        throw new BadRequestError('Danh mục menu không tồn tại')
      }
      return this.menuCategoryRepo.updateStatusMenuCategory(updateStatusMenuCategoryDto, account)
    } catch (error) {
      saveLogSystem({
        action: 'updateStatusMenuCategory',
        class: 'MenuCategoryService',
        function: 'updateStatusMenuCategory',
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
      mcat_name
    }: {
      pageSize: number
      pageIndex: number
      mcat_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<MenuCategoryEntity>> {
    try {
      if (!mcat_name && typeof mcat_name !== 'string') {
        throw new BadRequestError('Danh mục menu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataMenuCategory = await this.menuCategoryQuery.findAllPagination(
        { pageSize, pageIndex, mcat_name, isDeleted: 0 },
        account
      )

      return dataMenuCategory
    } catch (error) {
      saveLogSystem({
        action: 'findAll',
        class: 'MenuCategoryService',
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
      mcat_name
    }: {
      pageSize: number
      pageIndex: number
      mcat_name: string
    },
    account: IAccount
  ): Promise<ResultPagination<MenuCategoryEntity>> {
    try {
      if (!mcat_name && typeof mcat_name !== 'string') {
        throw new BadRequestError('Danh mục menu không tồn tại, vui lòng thử lại sau ít phút')
      }

      pageIndex = isNaN(pageIndex) ? 0 : pageIndex
      pageSize = isNaN(pageSize) ? 10 : pageSize

      const dataMenuCategory = await this.menuCategoryQuery.findAllPagination(
        { pageSize, pageIndex, mcat_name, isDeleted: 1 },
        account
      )

      return dataMenuCategory
    } catch (error) {
      saveLogSystem({
        action: 'findAllRecycle',
        class: 'MenuCategoryService',
        function: 'findAllRecycle',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }

  async findAllCatName(account: IAccount): Promise<MenuCategoryEntity[]> {
    try {
      return this.menuCategoryQuery.findAllCatName(account)
    } catch (error) {
      saveLogSystem({
        action: 'findAllCatName',
        class: 'MenuCategoryService',
        function: 'findAllCatName',
        message: error.message,
        time: new Date(),
        error: error,
        type: 'error'
      })
      throw new ServerErrorDefault(error)
    }
  }
}
