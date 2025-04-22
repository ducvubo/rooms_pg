import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { CreateMenuCategoryDto } from './create-menu-category.dto'

export class UpdateMenuCategoryDto extends PartialType(CreateMenuCategoryDto) {
  @IsNotEmpty({ message: 'Id không được để trống' })
  @IsUUID('4', { message: 'Id phải là một ObjectId hợp lệ' })
  mcat_id: string
}
