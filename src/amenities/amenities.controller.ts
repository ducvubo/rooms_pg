import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { Acccount, ResponseMessage } from 'src/decorator/customize'
import { AccountAuthGuard } from 'src/guard/account.guard'
import { IAccount } from 'src/guard/interface/account.interface'
import { UpdateResult } from 'typeorm'
import { ResultPagination } from 'src/interface/resultPagination.interface'
import { AmenitiesService } from './amenities.service'
import { AmenitiesEntity } from './entities/amenities.entity'
import { CreateAmenitiesDto } from './dto/create-amenities.dto'
import { UpdateAmenitiesDto } from './dto/update-amenities.dto'
import { UpdateStatusAmenitiesDto } from './dto/update-status-amenities.dto'
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) { }

  @Post()
  @ResponseMessage('Thêm danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async createAmenities(
    @Body() createAmenitiesDto: CreateAmenitiesDto,
    @Acccount() account: IAccount
  ): Promise<AmenitiesEntity> {
    return this.amenitiesService.createAmenities(createAmenitiesDto, account)
  }

  @Patch()
  @ResponseMessage('Cập nhật danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async updateAmenities(
    @Body() updateAmenitiesDto: UpdateAmenitiesDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.amenitiesService.updateAmenities(updateAmenitiesDto, account)
  }

  @Get()
  @ResponseMessage('Lấy danh sách danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async findAll(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('ame_name') ame_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<AmenitiesEntity>> {
    return await this.amenitiesService.findAll(
      {
        ame_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Get('ame-name')
  @ResponseMessage('Lấy danh sách tên danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async findAllAmenitiesName(@Acccount() account: IAccount): Promise<AmenitiesEntity[]> {
    return await this.amenitiesService.findAllAmenitiesName(account)
  }

  @Get('/ame-by-restaurant/:restaurant_id')
  @ResponseMessage('Lấy danh sách danh mục menu theo nhà hàng thành công')
  async findAllByRestaurantId(
    @Param('restaurant_id') restaurant_id: string
  ): Promise<AmenitiesEntity[]> {
    return await this.amenitiesService.findAllAmenitiesByResId({ ame_res_id: restaurant_id })
  }

  @Get('/recycle')
  @ResponseMessage('Lấy danh sách danh mục menu đã xóa thành công')
  @UseGuards(AccountAuthGuard)
  async findAllRecycle(
    @Query('current') pageIndex: string,
    @Query('pageSize') pageSize: string,
    @Query('ame_name') ame_name: string,
    @Acccount() account: IAccount
  ): Promise<ResultPagination<AmenitiesEntity>> {
    return await this.amenitiesService.findAllRecycle(
      {
        ame_name,
        pageSize: +pageSize,
        pageIndex: +pageIndex
      },
      account
    )
  }

  @Patch('update-status')
  @ResponseMessage('Cập nhật trạng thái danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async updateStatusAmenities(
    @Body() updateStatusAmenitiesDto: UpdateStatusAmenitiesDto,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.amenitiesService.updateStatusAmenities(updateStatusAmenitiesDto, account)
  }

  @Patch('restore/:ame_id')
  @ResponseMessage('Khôi phục danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async restoreAmenities(
    @Param('ame_id') ame_id: string,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.amenitiesService.restoreAmenities(ame_id, account)
  }

  @Delete(':ame_id')
  @ResponseMessage('Xóa danh mục menu thành công')
  @UseGuards(AccountAuthGuard)
  async deleteAmenities(
    @Param('ame_id') ame_id: string,
    @Acccount() account: IAccount
  ): Promise<UpdateResult> {
    return this.amenitiesService.deleteAmenities(ame_id, account)
  }

  @Get(':ame_id')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy thông tin danh mục menu thành công')
  async findOneById(
    @Param('ame_id') ame_id: string,
    @Acccount() account: IAccount
  ): Promise<AmenitiesEntity> {
    return this.amenitiesService.findOneById(ame_id, account)
  }
}
