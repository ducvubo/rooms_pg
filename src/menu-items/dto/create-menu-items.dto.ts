import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreateMenuItemsDto {
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString({ message: 'Tên danh mục phải là chuỗi' })
  mitems_name: string

  @IsNotEmpty({ message: 'Giá không được để trống' })
  @IsNumber({}, { message: 'Giá phải là số' })
  mitems_price: number

  @IsNotEmpty({ message: 'Ảnh không được để trống' })
  @IsString({ message: 'Ảnh phải là chuỗi' })
  mitems_image: string

  @IsNotEmpty({ message: 'Ghi chú không được để trống' })
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  mitems_note: string

  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  mitems_description?: string
}
