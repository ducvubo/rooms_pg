import { Module } from '@nestjs/common';
import { BookRoomService } from './book-room.service';
import { BookRoomController } from './book-room.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookRoomEntity } from './entities/book-room.entity';
import { AmenitiesSnapEntity } from './entities/amenities-snap.entity';
import { MenuItemsSnapEntity } from './entities/menu-itmes-snap.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BookRoomEntity, AmenitiesSnapEntity, MenuItemsSnapEntity])],
  controllers: [BookRoomController],
  providers: [BookRoomService],
})
export class BookRoomModule { }
