import { Module } from '@nestjs/common';
import { MenuCategoryService } from './menu-category.service';
import { MenuCategoryController } from './menu-category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuCategoryEntity } from './entities/menu-category.entity';
import { MenuCategoryRepo } from './entities/menu-category.repo';
import { MenuCategoryQuery } from './entities/menu-category.query';

@Module({
  imports: [TypeOrmModule.forFeature([MenuCategoryEntity])],
  controllers: [MenuCategoryController],
  providers: [MenuCategoryService, MenuCategoryRepo, MenuCategoryQuery],
  exports: [MenuCategoryService, MenuCategoryRepo, MenuCategoryQuery]
})
export class MenuCategoryModule { }
