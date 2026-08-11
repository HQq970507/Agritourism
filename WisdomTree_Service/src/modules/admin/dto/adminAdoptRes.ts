// 管理员获取认领表
interface AdminGetAdoptRes {
  status: number;
  code: number;
  message: string;
  data: {
    page: number;
    pagesize: number;
    total: number;
    adoptList: Array<AdminGetAdoptDataRes>;
  };
}

interface AdminGetAdoptDataRes {
  id: number;
  username: string;
  adoption_id: string;
  product_name: string;
  product_image: string;
  area: string;
  wish: string;
  nickname: string;
  status: string;
  contract_id: number | null;
  trace_code: string;
}

// 获取领养详情
interface AdminGetAdoptDetailRes {
  status: number;
  code: number;
  message: string;
  data: AdminGetAdoptDetailData;
}

interface AdminGetAdoptDetailData extends AdminGetAdoptDataRes {}

interface AdminPutAdoptDetailRes {
  status: number;
  code: number;
  message: string;
}

// 删除领养
interface AdminDelAdoptRes extends AdminPutAdoptDetailRes {}

export {
  AdminGetAdoptRes,
  AdminGetAdoptDetailRes,
  AdminPutAdoptDetailRes,
  AdminGetAdoptDataRes,
  AdminDelAdoptRes,
};
