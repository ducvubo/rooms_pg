import 'reflect-metadata'
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UploadModule } from './upload/upload.module'
import {
  TicketGuestRestaurantEntity,
  TicketGuestRestaurantSubscriber
} from './ticket-guest-restaurant/entities/ticket-guest-restaurant.entity'
import { TicketGuestRestaurantModule } from './ticket-guest-restaurant/ticket-guest-restaurant.module'
import { TickGuestRestaurantReplicesModule } from './tick-guest-restaurant-replices/tick-guest-restaurant-replices.module'
import { TicketGuestRestaurantReplicesEntity, TicketGuestRestaurantReplicesSubscriber } from './tick-guest-restaurant-replices/entities/tick-guest-restaurant-replices.entity'
import { MenuItemsModule } from './menu-items/menu-items.module';
import { AmenitiesModule } from './amenities/amenities.module';
import { RoomsModule } from './rooms/rooms.module';
import { AmenitiesEntity, AmenitiesSubscriber } from './amenities/entities/amenities.entity'
import { MenuItemsEntity, MenuItemsSubscriber } from './menu-items/entities/menu-items.entity'
import { RoomsEntity, RoomsSubscriber } from './rooms/entities/rooms.entity'
import { BookRoomModule } from './book-room/book-room.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'pg-102d6f8e-vminhduc8-88ed.h.aivencloud.com',
      port: 13890,
      username: 'avnadmin',
      password: 'AVNS_1OsX3Ol7nY47D5aQUuK',
      database: 'bookpg',
      entities: [
        TicketGuestRestaurantEntity,
        TicketGuestRestaurantReplicesEntity,
        AmenitiesEntity,
        MenuItemsEntity,
        RoomsEntity
      ],
      subscribers: [
        TicketGuestRestaurantSubscriber,
        TicketGuestRestaurantReplicesSubscriber,
        AmenitiesSubscriber,
        MenuItemsSubscriber,
        RoomsSubscriber
      ],
      synchronize: true,
      ssl: {
        rejectUnauthorized: true,
        ca: `-----BEGIN CERTIFICATE-----
MIIEQTCCAqmgAwIBAgIUQY7nMA1Dr5125SykqdHnGrmfnkUwDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvNWE5OTk1NTAtMmJiMC00YzNmLWI0NTMtYmY4Mzc0ZDE3
MjY2IFByb2plY3QgQ0EwHhcNMjQwMjI0MTcwMDMwWhcNMzQwMjIxMTcwMDMwWjA6
MTgwNgYDVQQDDC81YTk5OTU1MC0yYmIwLTRjM2YtYjQ1My1iZjgzNzRkMTcyNjYg
UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAOb9OIfQ
t7tkY51nBWjN9nHz1c2kV5DI/s8MDih1+ItbahkSExtoAnmc69G8xwGr7C0xOyli
GbfnvwpGgI38uhrvRNuwPEA0o05lGE6HW6tMQGn6w9BjLJchffi2UqN9pfMOOlEo
32LxPeO4YDmkex/u9NBkrwTC61HHI44p5Q/fXpV64/hUAixgDWD3RphHkuke8V2s
OYEUVixU/G+FvO/cGqR0is24DLi6+YRAIyQJkaJRUxrfvgQD7aE0oPoBdlBYqEuM
R5yxz9wG9H6e6z1/1GU7JdTrz732g4NmBydtFaJ2HicDVpOu2y55tgyY1wLYUKQA
ybGqicPPvj+DK1BrKhZDHAQqh08vKCvwbAgjqHoVrnzr52v7Z34kwJLd1nQMQm1h
RpbErJf+NDmri6xOStfXiHnYJkzZI+5y54ayI7pPqtuxaB3dOqDjdIoGIy8DkOEu
Ho4W7jRFnsk6G6CnEqf1QcLQov8lYqRYqisDyAAPqhVIXWCnk7CVUQejEQIDAQAB
oz8wPTAdBgNVHQ4EFgQU8bhFEvZQoknOh2NZ1v3g6CqiGXswDwYDVR0TBAgwBgEB
/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAL0bMDM/pDXxMcJr
qPmITe/C3VxU8+/OHr78TVJgOfl6m9UbUoVksuf4awckW2LhhgDvlpYH4bVME9dV
aegrZIQY6Lq4z3vXVLUx8/RhVlu8DJ8CkU3nqalbg/cPF57mTLp6wGxCMyJZkI82
fShRVpls6ZfsQxy7a5imQNQL561waaB4rNgYci2T9u+jEF4xRk9O79fj7CSvavAc
dfguj+aIRJSwx8zmIICPzjIceu5kqNurXiSrmXyaOXB33e2c/YIzuF+g8B9lpAZy
6o0VTdFu2ohphE0TV41RKfxLnaf7ErFov6Kk0x7dvGnMiLVlD+yMqFKF0Sxom30/
R4WLa5+WuRaZVwsrvbIp6f/oo5IYUUXvjIZGdDXEf1sy9rRp8Htb6/QFg9YS2MXg
Mu7yL/m6zel9OFQnTUQsPy+D6lIH1YYyI6j06CU+wx7uSzB00JClEZcIVFs8JN4a
uRh9HLbED2h+MekS2VLQ+qYA5Ocyd/yRXTON+YjT02yYIW/nKQ==
-----END CERTIFICATE-----
`
      }
    }),
    UploadModule,
    TicketGuestRestaurantModule,
    TickGuestRestaurantReplicesModule,
    MenuItemsModule,
    AmenitiesModule,
    RoomsModule,
    BookRoomModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule { }
