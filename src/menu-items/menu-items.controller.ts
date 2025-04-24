import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { MenuItemsService } from './menu-items.service'
import { CreateMenuItemsDto } from './dto/create-menu-items.dto'
import { MenuItemsEntity } from './entities/menu-items.entity'
import { UpdateMenuItemsDto } from './dto/update-menu-items.dto'
import { UpdateStatusMenuItemsDto } from './dto/update-status-menu-items.dto'
import { ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) { }

  @Post()
  @ResponseMessage('Thêm menu thành công')
  @UseGuards(AccountAuthGuard)
  async createMenuItems(
    @Body() createMenuItemsDto: CreateMenuItemsDto,
    @Acccount() account: IAccount
  ): Promise<MenuItemsEntity> {
    return this.menuItemsService.createMenuItems(createMenuItemsDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật menu thành công')
  @UseGuards(AccountAuthGuard)
  async updateMenuItems(
    @Body() updateMenuItemsDto: UpdateMenuItemsDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.menuItemsService.updateMenuItems(updateMenuItemsDto, account)
  }

  @Get()
  @ResponseMessage('Lấy danh sách menu thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('mitems_name') mitems_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<MenuItemsEntity>> {
    return await this.menuItemsService.findAll(
      {
        mitems_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Post('/import-menu-image')
  @ApiOperation({ summary: 'Nhận diện thực đơn từ ảnh' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Tải lên ảnh menu để nhận diện',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  @ResponseMessage('Nhận diện thực đơn từ ảnh thành công')
  async importMenuImage(@UploadedFile() file: Express.Multer.File): Promise<any> {
    if (!file) {
      throw new Error('Không có file được tải lên');
    }
    return await this.menuItemsService.extractMenuFromImage(file.buffer);
  }

  @Get('menu-name')
  @ResponseMessage('Lấy danh sách tên menu thành công')
  @UseGuards(AccountAuthGuard)
  async findAllCatName(@Acccount() account: IAccount): Promise<MenuItemsEntity[]> {
    return await this.menuItemsService.findAllItemsName(account)
  }

  @Get('menu-by-restaurant/:restaurant_id')
  @ResponseMessage('Lấy danh sách menu theo nhà hàng thành công')
  async findAllByRestaurantId(
    @Param('restaurant_id') restaurant_id: string
  ): Promise<MenuItemsEntity[]> {
    return await this.menuItemsService.findAllMenuItemsByResId({ mitems_res_id: restaurant_id })
  }

  @Get('/recycle')
  @ResponseMessage('Lấy danh sách menu đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findAllRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('mitems_name') mitems_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<MenuItemsEntity>> {
    return await this.menuItemsService.findAllRecycle(
      {
        mitems_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Patch('update-status')
  @ResponseMessage('Cập nhật trạng thái menu thành công')
  @UseGuards(AccountAuthGuard)
  async updateStatusMenuItems(
    @Body() updateStatusMenuItemsDto: UpdateStatusMenuItemsDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.menuItemsService.updateStatusMenuItems(updateStatusMenuItemsDto, account)
  }

  @Patch('restore/:mitems_id')
  @ResponseMessage('Khôi phục menu thành công')
  @UseGuards(AccountAuthGuard)
  async restoreMenuItems(
    @Param('mitems_id') mitems_id: string,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.menuItemsService.restoreMenuItems(mitems_id, account)
  }

  @Delete(':mitems_id')
  @ResponseMessage('Xóa menu thành công')
  @UseGuards(AccountAuthGuard)
  async deleteMenuItems(
    @Param('mitems_id') mitems_id: string,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.menuItemsService.deleteMenuItems(mitems_id, account)
  }

  @Get(':mitems_id')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy thông tin menu thành công')
  async findOneById(
    @Param('mitems_id') mitems_id: string,
    @Acccount() account: IAccount
  ): Promise<MenuItemsEntity> {
    return this.menuItemsService.findOneById(mitems_id, account)
  }
}
