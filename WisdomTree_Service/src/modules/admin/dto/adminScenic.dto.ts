import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

// 创建景区
export class CreateScenicDto {
  @IsNotEmpty({ message: '景区名称不能为空' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  level: string;

  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsOptional()
  @IsString()
  cover_image: string;

  @IsOptional()
  @IsString()
  opening_hours: string;

  @IsOptional()
  @IsString()
  ticket: string;

  @IsOptional()
  @IsString()
  contact: string;

  @IsOptional()
  @IsString()
  longitude: string;

  @IsOptional()
  @IsString()
  latitude: string;

  @IsOptional()
  @IsString()
  website: string;

  @IsOptional()
  @IsString()
  weather_code: string;

  @IsOptional()
  @IsBoolean()
  is_featured: boolean;
}

// 更新景区（ID 从路由取）
export class UpdateScenicDto extends CreateScenicDto {}
