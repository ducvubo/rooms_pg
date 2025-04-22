import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateAmenitiesDto } from './create-amenities.dto'

export class UpdateAmenitiesDto extends PartialType(CreateAmenitiesDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  ame_id: string
}
