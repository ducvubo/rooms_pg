import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class CreateAmenitiesDto {
  @IsNotEmpty({ message: 'Tên tiện ích không được để trống' })
  @IsString({ message: 'Tên tiện ích phải là chuỗi' })
  ame_name: string

  @IsNotEmpty({ message: 'Giá không được để trống' })
  @IsNumber({}, { message: 'Giá phải là số' })
  ame_price: number

  @IsNotEmpty({ message: 'Ghi chú không được để trống' })
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  ame_note: string

  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString({ message: 'Mô tả phải là chuỗi' })
  ame_description?: string
}
