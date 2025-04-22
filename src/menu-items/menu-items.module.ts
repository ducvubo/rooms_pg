import { Module } from '@nestjs/common';
import { MenuItemsService } from './menu-items.service';
import { MenuItemsController } from './menu-items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItemsEntity } from './entities/menu-items.entity';
import { MenuItemsQuery } from './entities/menu-items.query';
import { MenuItemsRepo } from './entities/menu-items.repo';
import { MenuCategoryModule } from 'src/menu-category/menu-category.module';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItemsEntity]), MenuCategoryModule],
  controllers: [MenuItemsController],
  providers: [MenuItemsService, MenuItemsQuery, MenuItemsRepo],
})
export class MenuItemsModule { }
