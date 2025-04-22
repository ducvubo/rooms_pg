import { Module } from '@nestjs/common';
import { AmenitiesService } from './amenities.service';
import { AmenitiesController } from './amenities.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmenitiesEntity } from './entities/amenities.entity';
import { AmenitiesQuery } from './entities/amenities.query';
import { AmenitiesRepo } from './entities/amenities.repo';

@Module({
  imports: [TypeOrmModule.forFeature([AmenitiesEntity])],
  controllers: [AmenitiesController],
  providers: [AmenitiesService, AmenitiesQuery, AmenitiesRepo],
})
export class AmenitiesModule { }
