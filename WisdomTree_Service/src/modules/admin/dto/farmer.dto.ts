import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// 农户注册（入驻）
class FarmerRegisterDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  farmName?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export { FarmerRegisterDto };
