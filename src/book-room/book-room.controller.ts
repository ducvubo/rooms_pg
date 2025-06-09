import { Body, Controller, Get, Param, Patch, Post, Query, Request, Res, UseGuards } from '@nestjs/common';
import { Request as RequestExpress } from 'express';
import { BookRoomService } from './book-room.service';
import { Acccount, ResponseMessage } from 'src/decorator/customize';
import { CreateBookRoomDto } from './dto/create-book-room.dto';
import { BookRoomEntity } from './entities/book-room.entity';
import { AccountAuthGuard } from 'src/guard/account.guard';
import { IAccount } from 'src/guard/interface/account.interface';
import { ResultPagination } from 'src/interface/resultPagination.interface';

@Controller('book-room')
export class BookRoomController {
  constructor(private readonly bookRoomService: BookRoomService) { }

  @Post('/create-book-room')
  @ResponseMessage('Đặt phòng thành công, vui lòng xác nhận trong email')
  async createBookRoom(@Body() createBookRoomDto: CreateBookRoomDto, @Request() req: RequestExpress): Promise<BookRoomEntity> {
    return await this.bookRoomService.createBookRoom(createBookRoomDto, req.headers['x-cl-id'] as string);
  }

  @Patch('/restaurant-confirm-deposit')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Xác nhận thanh toán cọc thành công')
  async restaurantConfirmDepositBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantConfirmDepositBookRoom(bkr_id, account);
  }

  @Patch('/guest-confirm')
  @ResponseMessage('Xác nhận đặt phòng thành công')
  async guestConfirmBookRoom(@Body('bkr_id') bkr_id: string, @Body('bkr_res_id') bkr_res_id: string): Promise<BookRoomEntity> {
    return await this.bookRoomService.guestConfirmBookRoom(bkr_id, bkr_res_id);
  }

  @Patch('/restaurant-confirm')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Nhà hàng xác nhận đặt phòng thành công')
  async restaurantConfirmBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantConfirmBookRoom(bkr_id, account);
  }

  @Patch('/guest-cancel')
  @ResponseMessage('Hủy đặt phòng thành công')
  async guestCancelBookRoom(
    @Body('bkr_id') bkr_id: string,
    @Body('bkr_reason_cancel') bkr_reason_cancel: string,
  ): Promise<BookRoomEntity> {
    return await this.bookRoomService.guestCancelBookRoom(bkr_id, bkr_reason_cancel);
  }

  @Patch('/restaurant-cancel')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Nhà hàng hủy đặt phòng thành công')
  async restaurantCancelBookRoom(
    @Body('bkr_id') bkr_id: string,
    @Body('bkr_reason_cancel') bkr_reason_cancel: string,
    @Acccount() account: IAccount,
  ): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantCancelBookRoom(bkr_id, bkr_reason_cancel, account);
  }

  @Patch('/restaurant-check-in')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Xác nhận khách check-in thành công')
  async restaurantCheckInBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantCheckInBookRoom(bkr_id, account);
  }

  @Patch('/restaurant-in-use')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Xác nhận phòng đang sử dụng thành công')
  async restaurantInUseBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantInUseBookRoom(bkr_id, account);
  }

  @Patch('/restaurant-no-show')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Xác nhận khách không đến thành công')
  async restaurantNoShowBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantNoShowBookRoom(bkr_id, account);
  }

  @Patch('/restaurant-refund-deposit')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Xác nhận hoàn tiền toàn bộ thành công')
  async restaurantRefundDepositBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantRefundDepositBookRoom(bkr_id, account);
  }

  @Patch('/restaurant-refund-one-third-deposit')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Xác nhận hoàn tiền 1/3 thành công')
  async restaurantRefundOneThirdDepositBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantRefundOneThirdDepositBookRoom(bkr_id, account);
  }

  @Patch('/restaurant-refund-one-two-deposit')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Xác nhận hoàn tiền 2/3 thành công')
  async restaurantRefundOneTwoDepositBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantRefundOneTwoDepositBookRoom(bkr_id, account);
  }

  @Patch('/restaurant-no-deposit')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Xác nhận không hoàn tiền thành công')
  async restaurantNoDepositBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantNoDepositBookRoom(bkr_id, account);
  }

  @Patch('/restaurant-check-out')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Xác nhận khách trả phòng thành công')
  async restaurantCheckOutBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantCheckOutBookRoom(bkr_id, account);
  }

  @Patch('/restaurant-check-out-overtime')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Xác nhận khách trả phòng quá giờ thành công')
  async restaurantCheckOutOvertimeBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantCheckOutOvertimeBookRoom(bkr_id, account);
  }

  @Patch('/restaurant-confirm-payment')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Xác nhận thanh toán thành công')
  async restaurantConfirmPaymentBookRoom(
    @Body('bkr_id') bkr_id: string,
    @Body('bkr_plus_price') bkr_plus_price: string,
    @Acccount() account: IAccount,
  ): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantConfirmPaymentBookRoom(bkr_id, bkr_plus_price, account);
  }

  @Patch('/guest-exception')
  @ResponseMessage('Ghi nhận sự cố của khách thành công')
  async guestExceptionBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.guestExceptionBookRoom(bkr_id, account);
  }

  @Patch('/restaurant-exception')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Ghi nhận sự cố của nhà hàng thành công')
  async restaurantExceptionBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantExceptionBookRoom(bkr_id, account);
  }

  @Patch('/guest-complaint')
  @ResponseMessage('Ghi nhận khiếu nại của khách thành công')
  async guestComplaintBookRoom(@Body('bkr_id') bkr_id: string): Promise<BookRoomEntity> {
    return await this.bookRoomService.guestComplaintBookRoom(bkr_id);
  }

  @Patch('/done-complaint')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Xử lý khiếu nại thành công')
  async doneComplaintBookRoom(@Body('bkr_id') bkr_id: string, @Acccount() account: IAccount): Promise<BookRoomEntity> {
    return await this.bookRoomService.doneComplaintBookRoom(bkr_id, account);
  }

  @Patch('/guest-feedback')
  @ResponseMessage('Gửi phản hồi thành công')
  async guestFeedbackBookRoom(
    @Body('bkr_id') bkr_id: string,
    @Body('bkr_feedback') bkr_feedback: string,
    @Body('bkr_star') bkr_star: 1 | 2 | 3 | 4 | 5,
  ): Promise<BookRoomEntity> {
    return await this.bookRoomService.guestFeedbackBookRoom(bkr_id, bkr_feedback, bkr_star);
  }

  @Patch('/restaurant-feedback')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Phản hồi đánh giá của khách thành công')
  async restaurantFeedbackBookRoom(
    @Body('bkr_id') bkr_id: string,
    @Body('bkr_reply') bkr_reply: string,
    @Acccount() account: IAccount,
  ): Promise<BookRoomEntity> {
    return await this.bookRoomService.restaurantFeedbackBookRoom(bkr_id, bkr_reply, account);
  }

  @Post('/add-menu-items')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Thêm món ăn vào đặt phòng thành công')
  async addMenuItemsToBookRoom(
    @Body('bkr_id') bkr_id: string,
    @Body('menu_items') menu_items: { menu_id: string; bkr_menu_quantity: number }[],
    @Acccount() account: IAccount,
  ): Promise<BookRoomEntity> {
    return await this.bookRoomService.addMenuItemsToBookRoom(bkr_id, menu_items, account);
  }

  @Post('/add-amenities')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Thêm dịch vụ tiện ích vào đặt phòng thành công')
  async addAmenitiesToBookRoom(
    @Body('bkr_id') bkr_id: string,
    @Body('amenities') amenities: { ame_id: string; bkr_ame_quantity: number }[],
    @Acccount() account: IAccount,
  ): Promise<BookRoomEntity> {
    return await this.bookRoomService.addAmenitiesToBookRoom(bkr_id, amenities, account);
  }

  @Get('/restaurant-list')
  @UseGuards(AccountAuthGuard)
  @ResponseMessage('Lấy danh sách đặt phòng của nhà hàng thành công')
  async getListBookRoomRestaurantPagination(
    @Query('pageIndex') pageIndex: number,
    @Query('pageSize') pageSize: number,
    @Query('keyword') keyword: string,
    @Query('bkr_status') bkr_status: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Acccount() account: IAccount,
  ): Promise<ResultPagination<BookRoomEntity>> {
    return await this.bookRoomService.getListBookRoomRestauarntPagination(
      { pageIndex, pageSize, keyword, bkr_status, fromDate, toDate },
      account,
    );
  }

  @Get('/guest-list')
  @ResponseMessage('Lấy danh sách đặt phòng của khách hàng thành công')
  async getListBookRoomGuestPagination(
    @Query('pageIndex') pageIndex: number,
    @Query('pageSize') pageSize: number,
    @Query('keyword') keyword: string,
    @Query('bkr_status') bkr_status: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Request() req: RequestExpress,
  ): Promise<ResultPagination<BookRoomEntity>> {
    return await this.bookRoomService.getListBookRoomGuestPagination(
      { pageIndex, pageSize, keyword, bkr_status, fromDate, toDate },
      req.headers['x-cl-id'] as string,
    );
  }

  @Patch('/update-feed-view')
  @ResponseMessage('Cập nhật trạng thái xem phản hồi thành công')
  async updateFeedViewBookRoom(@Body('bkr_id') bkr_id: string, @Body('bkr_feed_view') bkr_feed_view: 'active' | 'disable'): Promise<BookRoomEntity> {
    return await this.bookRoomService.updateFeedViewBookRoom(bkr_id, bkr_feed_view);
  }

  @Get('/restaurant-feedback-list/:restaurant_id')
  @ResponseMessage('Lấy danh sách phản hồi của nhà hàng thành công')
  async getListFeedbackBookRoomRestaurantPagination(
    @Query('pageIndex') pageIndex: number,
    @Query('pageSize') pageSize: number,
    @Query('star') star: string,
    @Param('restaurant_id') restaurant_id: string,
  ): Promise<{
    meta: {
      pageIndex: number
      pageSize: number
      totalPage: number
      totalItem: number
    }
    result: BookRoomEntity[]
  }> {
    return await this.bookRoomService.getListFeedbackBookRoomRestaurantPagination(
      { pageIndex, pageSize, star, restaurant_id },
    );
  }
}