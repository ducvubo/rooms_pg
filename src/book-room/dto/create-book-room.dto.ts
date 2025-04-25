import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

export class CreateBookRoomDto {
  @IsNotEmpty({ message: "Nhà hàng không được để trống" })
  @IsString({ message: "Nhà hàng phải là chuỗi" })
  bkr_res_id: string

  @IsNotEmpty({ message: "Tên khách hàng không được để trống" })
  @IsString({ message: "Tên khách hàng phải là chuỗi" })
  bkr_ame: string

  @IsNotEmpty({ message: "Email không được để trống" })
  @IsString({ message: "Email phải là chuỗi" })
  bkr_email: string

  @IsNotEmpty({ message: "Số điện thoại không được để trống" })
  @IsString({ message: "Số điện thoại phải là chuỗi" })
  bkr_phone: string

  @IsNotEmpty({ message: "Thời gian bắt đầu không được để trống" })
  @IsString({ message: "Thời gian bắt đầu phải là chuỗi" })
  bkr_time_start: string

  @IsNotEmpty({ message: "Thời gian kết thúc không được để trống" })
  @IsString({ message: "Thời gian kết thúc phải là chuỗi" })
  bkr_time_end: string

  @IsOptional()
  @IsString({ message: "Ghi chú phải là chuỗi" })
  bkr_note: string

  @IsOptional()
  @IsArray({ message: 'Danh sách món ăn không hợp lệ' })
  @ValidateNested({ each: true })
  @Type(() => BookRoomMenu)
  menu_items: BookRoomMenu[]

  @IsOptional()
  @IsArray({ message: 'Danh sách dịch vụ không hợp lệ' })
  @ValidateNested({ each: true })
  @Type(() => BookRoomAmenity)
  amenities: BookRoomAmenity[]

  @IsNotEmpty({ message: "Link xác nhận không được để trống" })
  @IsString({ message: "Link xác nhận phải là chuỗi" })
  bkr_link_confirm: string
}

export class BookRoomMenu {
  @IsNotEmpty({ message: "Món ăn không được để trống" })
  @IsString({ message: "Món ăn phải là chuỗi" })
  menu_id: string

  @IsNotEmpty({ message: "Số lượng không được để trống" })
  @IsNumber({}, { message: "Số lượng phải là số" })
  bkr_menu_quantity: number
}

export class BookRoomAmenity {
  @IsNotEmpty({ message: "Dịch vụ không được để trống" })
  @IsString({ message: "Dịch vụ phải là chuỗi" })
  amenity_id: string

  @IsNotEmpty({ message: "Số lượng không được để trống" })
  @IsNumber({}, { message: "Số lượng phải là số" })
  bkr_amenity_quantity: number
}
