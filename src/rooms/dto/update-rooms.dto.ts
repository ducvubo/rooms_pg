import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateRoomsDto } from './create-rooms.dto'

export class UpdateRoomsDto extends PartialType(CreateRoomsDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  room_id: string
}
