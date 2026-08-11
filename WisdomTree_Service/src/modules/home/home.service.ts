import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdoptionsEntity } from 'src/database/entities/adoptions.entity';
import { GrowthDiaryEntity } from 'src/database/entities/growth_diary.entity';
import { PostEntity } from 'src/database/entities/community/post.entity';
import { LikeEntity } from 'src/database/entities/community/likes.entity';
import { ApiResponse } from 'src/common/interfaces/res.interface';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(AdoptionsEntity)
    private readonly adoptionRepo: Repository<AdoptionsEntity>,
    @InjectRepository(GrowthDiaryEntity)
    private readonly diaryRepo: Repository<GrowthDiaryEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(LikeEntity)
    private readonly likeRepo: Repository<LikeEntity>,
  ) {}

  /**
   * 首页动态聚合：最近认领 / 最新日记 / 热门帖子
   * 制造"有人在用"的社区感。
   */
  async getFeed(limit = 5): Promise<ApiResponse> {
    const take = Math.min(Math.max(limit, 1), 10);

    const [adoptions, diaries, posts] = await Promise.all([
      this.adoptionRepo.find({
        relations: ['user', 'product', 'product.category'],
        order: { id: 'DESC' },
        take,
      }),
      this.diaryRepo.find({
        relations: ['user', 'adoption', 'adoption.product', 'adoption.product.category'],
        order: { id: 'DESC' },
        take,
      }),
      this.postRepo.find({
        relations: ['user'],
        order: { createdAt: 'DESC' },
        take: take * 2,
      }),
    ]);

    const hotPosts = await Promise.all(
      posts.map(async (post) => ({
        id: post.id,
        title: post.title,
        type: post.type,
        likeCount: await this.likeRepo.count({
          where: { post: { id: post.id } },
        }),
        username: post.user?.username ?? '',
        avatar: post.user?.avatar ?? '',
        createdAt: post.createdAt,
      })),
    );
    hotPosts.sort((a, b) => b.likeCount - a.likeCount);

    return {
      status: HttpStatus.OK,
      code: 0,
      message: '获取成功',
      data: {
        recentAdoptions: adoptions.map((a) => {
          const category = a.product?.category;
          return {
            id: a.id,
            productName: category?.display_name || category?.name || '',
            username: a.user?.username ?? '',
            avatar: a.user?.avatar ?? '',
            status: a.status,
            adoptedAt: a.adopted_at,
          };
        }),
        recentDiaries: diaries.map((d) => {
          const category = d.adoption?.product?.category;
          return {
            id: d.id,
            productName: category?.display_name || category?.name || d.product_name,
            stage: d.stage,
            description: d.description,
            username: d.user?.username ?? '',
            avatar: d.user?.avatar ?? '',
            createdAt: d.created_at,
          };
        }),
        hotPosts: hotPosts.slice(0, take),
      },
    };
  }
}
