import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateRoomsDto {
  @IsNotEmpty({ message: 'Tên phòng/sảnh không được để trống' })
  @IsString({ message: 'Tên phòng/sảnh phải là chuỗi' })
  room_name: string

  // room_fix_ame
  @IsString({ message: 'Tên tiện ích phải là chuỗi' })
  @IsOptional()
  room_fix_ame: string

  // room_area
  @IsNotEmpty({ message: 'Diện tích không được để trống' })
  @IsString({ message: 'Diện tích phải là chuỗi' })
  room_area: string

  @IsNumber({}, { message: 'Số khách tối đa phải là số' })
  @IsOptional()
  room_max_guest: number

  @IsNumber({}, { message: 'Giá cơ bản phải là số' })
  @IsNotEmpty({ message: 'Giá cơ bản không được để trống' })
  room_base_price: number

  // room_note
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  room_note?: string

  // room_description
  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  room_description?: string

  // room_image
  @IsOptional()
  @IsString({ message: 'Ảnh phải là chuỗi' })
  room_images?: string
}
