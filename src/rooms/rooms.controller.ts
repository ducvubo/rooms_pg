import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { RoomsService } from './rooms.service'
import { CreateRoomsDto } from './dto/create-rooms.dto'
import { RoomsEntity } from './entities/rooms.entity'
import { UpdateRoomsDto } from './dto/update-rooms.dto'
import { UpdateStatusRoomsDto } from './dto/update-status-rooms.dto'

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) { }

  @Post()
  @ResponseMessage('Thêm menu thành công')
  @UseGuards(AccountAuthGuard)
  async createRooms(
    @Body() createRoomsDto: CreateRoomsDto,
    @Acccount() account: IAccount
  ): Promise<RoomsEntity> {
    return this.roomsService.createRooms(createRoomsDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật menu thành công')
  @UseGuards(AccountAuthGuard)
  async updateRooms(
    @Body() updateRoomsDto: UpdateRoomsDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.roomsService.updateRooms(updateRoomsDto, account)
  }

  @Get()
  @ResponseMessage('Lấy danh sách menu thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('room_name') room_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<RoomsEntity>> {
    return await this.roomsService.findAll(
      {
        room_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Get('menu-name')
  @ResponseMessage('Lấy danh sách tên menu thành công')
  @UseGuards(AccountAuthGuard)
  async findAllCatName(@Acccount() account: IAccount): Promise<RoomsEntity[]> {
    return await this.roomsService.findAllItemsName(account)
  }

  @Get('/recycle')
  @ResponseMessage('Lấy danh sách menu đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findAllRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('room_name') room_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<RoomsEntity>> {
    return await this.roomsService.findAllRecycle(
      {
        room_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Patch('update-status')
  @ResponseMessage('Cập nhật trạng thái menu thành công')
  @UseGuards(AccountAuthGuard)
  async updateStatusRooms(
    @Body() updateStatusRoomsDto: UpdateStatusRoomsDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.roomsService.updateStatusRooms(updateStatusRoomsDto, account)
  }

  @Patch('restore/:room_id')
  @ResponseMessage('Khôi phục menu thành công')
  @UseGuards(AccountAuthGuard)
  async restoreRooms(
    @Param('room_id') room_id: string,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.roomsService.restoreRooms(room_id, account)
  }

  @Delete(':room_id')
  @ResponseMessage('Xóa menu thành công')
  @UseGuards(AccountAuthGuard)
  async deleteRooms(
    @Param('room_id') room_id: string,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.roomsService.deleteRooms(room_id, account)
  }

  @Get(':room_id')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy thông tin menu thành công')
  async findOneById(
    @Param('room_id') room_id: string,
    @Acccount() account: IAccount
  ): Promise<RoomsEntity> {
    return this.roomsService.findOneById(room_id, account)
  }
}
