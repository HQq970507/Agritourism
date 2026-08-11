import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 生成生长日记请求
 */
export class GenerateDiaryDto {
  @IsNotEmpty({ message: '产品名称不能为空' })
  @IsString({ message: '请输入正确的产品名称' })
  productName: string;
}

/**
 * 生长日记响应
 */
export class GrowthDiaryResponseDto {
  id: number;
  product_name: string;
  stage: string;
  day_count: number;
  description: string;
  temperature: string;
  humidity: string;
  media_url: string;
  created_at: Date;
}

/**
 * 慢直播频道响应
 */
export class LivestreamResponseDto {
  id: number;
  channel_name: string;
  product_name: string;
  stream_url: string;
  is_live: boolean;
  viewers: number;
  location: string;
  created_at: Date;
  updated_at: Date;
}
