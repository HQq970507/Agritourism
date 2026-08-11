import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdoptionsEntity } from 'src/database/entities/adoptions.entity';
import { Repository } from 'typeorm';
import {
  AdminDelAdoptRes,
  AdminGetAdoptDataRes,
  AdminGetAdoptDetailRes,
  AdminGetAdoptRes,
  AdminPutAdoptDetailRes,
} from '../dto/adminAdoptRes';
import {
  BadAdminGetAdoptException,
  BadAdminPutAdoptException,
  NoAdoptException,
} from '../exception/adminAdopt.exception';
import { UserEntity } from 'src/database/entities/user.entity';

/** 认领产品的展示名（分类展示名优先） */
function productNameOf(adoption: AdoptionsEntity): string {
  const category = adoption.product?.category;
  return category?.display_name || category?.name || '';
}

/** 认领产品的首图 */
function productImageOf(adoption: AdoptionsEntity): string {
  const media = Array.isArray(adoption.product?.media)
    ? adoption.product.media
    : [];
  return media.length > 0 ? media[0].media_url : '';
}

@Injectable()
export class AdminAdoptService {
  constructor(
    @InjectRepository(AdoptionsEntity)
    private readonly adoptRepository: Repository<AdoptionsEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  // 管理员获取认领表（分页）
  async getAdoptList(
    page: number,
    pagesize: number,
  ): Promise<AdminGetAdoptRes> {
    try {
      const [adoptList, total] = await this.adoptRepository.findAndCount({
        relations: ['user', 'product', 'product.category', 'product.media'],
        order: { id: 'DESC' },
        skip: (page - 1) * pagesize,
        take: pagesize,
      });

      const data: Array<AdminGetAdoptDataRes> = adoptList.map(
        (item: AdoptionsEntity) => {
          return {
            id: item.id,
            username: item.user?.username ?? '',
            adoption_id: item.adoption_id,
            area: item.area,
            wish: item.wish,
            nickname: item.nickname,
            product_name: productNameOf(item),
            product_image: productImageOf(item),
            status: item.status,
            contract_id: item.contract?.id ?? null,
            trace_code: item.trace_code ?? '',
          };
        },
      );
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '管理员获取认领表成功',
        data: {
          page,
          pagesize,
          total,
          adoptList: data,
        },
      };
    } catch (error) {
      console.log(error);
      throw new BadAdminGetAdoptException();
    }
  }

  // 管理员获取某认领详情
  async getAdoptDetail(AdoptId: number): Promise<AdminGetAdoptDetailRes> {
    try {
      const data: AdoptionsEntity = await this.adoptRepository.findOne({
        where: { id: AdoptId },
        relations: ['user', 'product', 'product.category', 'product.media'],
      });
      if (!data) {
        throw new NoAdoptException();
      }
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '管理员获取认领表详情成功',
        data: {
          id: data.id,
          username: data.user?.username ?? '',
          adoption_id: data.adoption_id,
          nickname: data.nickname,
          area: data.area,
          wish: data.wish,
          product_name: productNameOf(data),
          product_image: productImageOf(data),
          status: data.status,
          contract_id: data.contract?.id ?? null,
          trace_code: data.trace_code ?? '',
        },
      };
    } catch (error) {
      console.log(error);
      throw new BadAdminGetAdoptException();
    }
  }

  // 管理员修改认领信息（产品化改造后：仅更新基础字段）
  async updateAdopt(body: any): Promise<AdminPutAdoptDetailRes> {
    try {
      const { AdoptID } = body;
      const exist = await this.adoptRepository.findOne({
        where: { id: AdoptID },
      });
      if (!exist) {
        throw new NoAdoptException();
      }

      const updateData: Partial<AdoptionsEntity> = {};
      if (typeof body.nickname === 'string') {
        updateData.nickname = body.nickname;
      }
      if (typeof body.area === 'string') {
        updateData.area = body.area;
      }
      if (typeof body.wish === 'string') {
        updateData.wish = body.wish;
      }
      if (typeof body.status === 'string') {
        updateData.status = body.status;
      }

      await this.adoptRepository.update({ id: AdoptID }, updateData);

      return {
        status: HttpStatus.OK,
        code: 0,
        message: '管理员更新某认领成功',
      };
    } catch (error) {
      console.log(error);
      throw new BadAdminPutAdoptException();
    }
  }

  // 管理员删除某认领
  async deleteAdopt(AdoptID: number): Promise<AdminDelAdoptRes> {
    try {
      const adoptData: AdoptionsEntity = await this.adoptRepository.findOne({
        where: { id: AdoptID },
      });
      if (!adoptData) {
        throw new NoAdoptException();
      }
      await this.adoptRepository.delete({ id: AdoptID });
      return {
        status: HttpStatus.OK,
        code: 0,
        message: '管理员删除领养记录成功',
      };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
