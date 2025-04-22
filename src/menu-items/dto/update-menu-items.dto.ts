import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateMenuItemsDto } from './create-menu-items.dto'

export class UpdateMenuItemsDto extends PartialType(CreateMenuItemsDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  mitems_id: string
}
