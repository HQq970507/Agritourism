// 用户注册
interface AdminCreateResDto {
  status: number;
  code: number;
  message: string;
}

// 用户登录
interface AdminLoginResDto {
  status: number;
  code: number;
  message: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    role: string;
  };
}

// 农户注册
interface FarmerRegisterResDto {
  status: number;
  code: number;
  message: string;
  data?: {
    id: number;
    username: string;
    role: string;
    status: string;
    farmName: string | null;
    qualification: string | null;
    phone: string | null;
  };
}

export { AdminLoginResDto, AdminCreateResDto, FarmerRegisterResDto };
