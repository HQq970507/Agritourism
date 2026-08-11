import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsString,
  Min,
} from 'class-validator';

/**
 * 创建合同
 * 根据模板ID与已填写的字段值渲染合同内容。
 */
export class CreateContractDto {
  @IsNotEmpty({ message: '模板ID不能为空' })
  @Type(() => Number)
  @IsInt({ message: '请输入正确的模板ID' })
  @Min(1, { message: '模板ID必须大于0' })
  templateId: number;

  @IsNotEmpty({ message: '合同字段不能为空' })
  @IsObject({ message: '合同字段格式错误' })
  fields: Record<string, any>;
}

/**
 * 电子签名
 * 输入姓名作为电子签名，服务端附加签署时间戳。
 */
export class SignContractDto {
  @IsNotEmpty({ message: '签名姓名不能为空' })
  @IsString({ message: '请输入正确的签名姓名' })
  signatureName: string;
}
