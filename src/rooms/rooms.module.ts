import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategoryEntity } from 'src/menu-category/entities/menu-category.entity';
import { RoomsEntity } from './entities/rooms.entity';
import { RoomsRepo } from './entities/rooms.repo';
import { RoomsQuery } from './entities/rooms.query';

@Module({
  imports: [TypeOrmModule.forFeature([RoomsEntity])],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepo, RoomsQuery],
})
export class RoomsModule { }
