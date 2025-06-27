import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UploadModule } from './upload/upload.module'
import { MenuItemsModule } from './menu-items/menu-items.module';
import { AmenitiesModule } from './amenities/amenities.module';
import { RoomsModule } from './rooms/rooms.module';
import { AmenitiesEntity, AmenitiesSubscriber } from './amenities/entities/amenities.entity'
import { MenuItemsEntity, MenuItemsSubscriber } from './menu-items/entities/menu-items.entity'
import { RoomsEntity, RoomsSubscriber } from './rooms/entities/rooms.entity'
import { BookRoomModule } from './book-room/book-room.module';
import { BookRoomEntity } from './book-room/entities/book-room.entity'
import { AmenitiesSnapEntity } from './book-room/entities/amenities-snap.entity'
import { MenuItemsSnapEntity } from './book-room/entities/menu-itmes-snap.entity'
import { ScheduleModule } from '@nestjs/schedule'
import { CronService } from './cron/cron.service'
import { CronModule } from './cron/cron.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ScheduleModule.forRoot({}),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '160.191.245.32',
      port: 30316,
      username: 'root',
      password: 'Duc17052003*',
      database: 'RoomPG',
      entities: [
        AmenitiesEntity,
        MenuItemsEntity,
        RoomsEntity,
        BookRoomEntity,
        AmenitiesSnapEntity,
        MenuItemsSnapEntity
      ],
      subscribers: [
        AmenitiesSubscriber,
        MenuItemsSubscriber,
        RoomsSubscriber
      ],
      synchronize: true,
    }),
    UploadModule,
    MenuItemsModule,
    AmenitiesModule,
    RoomsModule,
    BookRoomModule,
    CronModule
  ],
  controllers: [AppController],
  providers: [AppService, CronService]
})
export class AppModule { }
