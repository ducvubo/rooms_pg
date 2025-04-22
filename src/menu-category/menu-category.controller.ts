import { MenuCategoryService } from './menu-category.service';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { MenuCategoryEntity } from './entities/menu-category.entity';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { UpdateStatusMenuCategoryDto } from './dto/update-status-menu-category.dto';

@Controller('menu-category')
export class MenuCategoryController {
  constructor(private readonly menuCategoryService: MenuCategoryService) { }
  @Post()
  @ResponseMessage('Thêm danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async createMenuCategory(
    @Body() createMenuCategoryDto: CreateMenuCategoryDto,
    @Acccount() account: IAccount
  ): Promise<MenuCategoryEntity> {
    return this.menuCategoryService.createMenuCategory(createMenuCategoryDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async updateMenuCategory(
    @Body() updateMenuCategoryDto: UpdateMenuCategoryDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.menuCategoryService.updateMenuCategory(updateMenuCategoryDto, account)
  }

  @Get()
  @ResponseMessage('Lấy danh sách danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('mcat_name') mcat_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<MenuCategoryEntity>> {
    return await this.menuCategoryService.findAll(
      {
        mcat_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Get('cat-name')
  @ResponseMessage('Lấy danh sách tên danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async findAllCatName(@Acccount() account: IAccount): Promise<MenuCategoryEntity[]> {
    return await this.menuCategoryService.findAllCatName(account)
  }

  @Get('/recycle')
  @ResponseMessage('Lấy danh sách danh mục menu đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findAllRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('mcat_name') mcat_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<MenuCategoryEntity>> {
    return await this.menuCategoryService.findAllRecycle(
      {
        mcat_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Patch('update-status')
  @ResponseMessage('Cập nhật trạng thái danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async updateStatusMenuCategory(
    @Body() updateStatusMenuCategoryDto: UpdateStatusMenuCategoryDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.menuCategoryService.updateStatusMenuCategory(updateStatusMenuCategoryDto, account)
  }

  @Patch('restore/:mcat_id')
  @ResponseMessage('Khôi phục danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async restoreMenuCategory(
    @Param('mcat_id') mcat_id: string,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.menuCategoryService.restoreMenuCategory(mcat_id, account)
  }

  @Delete(':mcat_id')
  @ResponseMessage('Xóa danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async deleteMenuCategory(
    @Param('mcat_id') mcat_id: string,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.menuCategoryService.deleteMenuCategory(mcat_id, account)
  }

  @Get(':mcat_id')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy thông tin danh mục menu thành công')
  async findOneById(
    @Param('mcat_id') mcat_id: string,
    @Acccount() account: IAccount
  ): Promise<MenuCategoryEntity> {
    return this.menuCategoryService.findOneById(mcat_id, account)
  }
}
