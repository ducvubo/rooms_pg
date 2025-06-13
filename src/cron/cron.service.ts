import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookRoomEntity, BookRoomStatus } from 'src/book-room/entities/book-room.entity';
import { DataSource, LessThan } from 'typeorm';

@Injectable()
export class CronService {
  constructor(private readonly dataSource: DataSource) { }

  @Cron('* * * * *')
  async checkbookRoomTimeouts() {
    console.log('checkbookRoomTimeouts');
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      //bookRoomFood
      const currentTime = new Date();
      currentTime.setHours(currentTime.getHours());

      const tenMinutesAgo = new Date(currentTime);
      tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

      const overduebookRooms = await queryRunner.manager.find(BookRoomEntity, {
        where: {
          bkr_status: BookRoomStatus.NEW_CREATED,
          bkr_created_at: LessThan(tenMinutesAgo),
        },
      });

      if (overduebookRooms.length > 0) {
        await Promise.all(
          overduebookRooms.map(async (bookRoom) => {
            bookRoom.bkr_status = BookRoomStatus.OVERTIME_GUEST;
            bookRoom.bkr_detail_history = JSON.stringify([
              ...(JSON.parse(bookRoom.bkr_detail_history || '[]')),
              {
                type: 'Quá hạn xác nhận',
                description: 'Đơn đặt phòng đã quá 10 phút mà không được xác nhận bởi khách hàng',
                time: currentTime,
              },
            ]);
            await queryRunner.manager.save(BookRoomEntity, bookRoom);
          })
        );
        console.log(`Updated ${overduebookRooms.length}  bookRooms to 'OVERTIME_GUEST'`);
      } else {
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Error in checkbookRoomTimeouts:', error.message);
    } finally {
      await queryRunner.release();
    }
  }
}