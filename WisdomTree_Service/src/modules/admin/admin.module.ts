import { Module } from '@nestjs/common';
import { AdminController } from './controller/admin.controller';
import { AdminService } from './service/admin.service';
import { DatabaseModule } from 'src/database/database.module';
import { AdminGuard } from './guard/admin.guard';
import { TokenModule } from '../token/token.module';
import { TreeModule } from '../tree/tree.module';
import { AdminTreeController } from './controller/adminTree.controller';
import { AdminTreeService } from './service/adminTree.service';
import { AdminAdoptController } from './controller/adminAdopt.controller';
import { AdminAdoptService } from './service/adminAdopt.service';
import { AdminTreeTypeService } from './service/adminTreeType.service';
import { AdminTreeTypeController } from './controller/adminTreeType.controller';
import { AdminAdoptUpdateService } from './service/adminAdoptUpdate.service';
import { AdminSearchController } from './controller/adminSearch.controller';
import { AdminSearchService } from './service/adminSearch.service';
import { AdminNewProductController } from './controller/adminNewProduct.controller';
import { AdminProductService } from './service/adminProduct.service';
import { AdminNewOrderController } from './controller/adminNewOrder.controller';
import { AdminOrderService } from './service/adminOrder.service';
import { AdminNewProductCategoryController } from './controller/adminNewProductCategory.controller';
import { AdminProductCategoryService } from './service/adminProductCategory.service';
import { AdminTravelController } from './controller/adminTravel.controller';
import { AdminTravelService } from './service/adminTravel.service';
import { AdminScenicController } from './controller/adminScenic.controller';
import { AdminScenicService } from './service/adminScenic.service';

@Module({
  imports: [DatabaseModule, TokenModule, TreeModule],
  controllers: [
    AdminController,
    AdminTreeController,
    AdminAdoptController,
    AdminTreeTypeController,
    AdminSearchController,
    AdminNewProductController,
    AdminNewOrderController,
    AdminNewProductCategoryController,
    AdminTravelController,
    AdminScenicController,
  ],
  providers: [
    AdminService,
    AdminTreeService,
    AdminAdoptService,
    AdminTreeTypeService,
    AdminGuard,
    AdminAdoptUpdateService,
    AdminSearchService,
    AdminProductService,
    AdminOrderService,
    AdminProductCategoryService,
    AdminTravelService,
    AdminScenicService,
  ],
})
export class AdminModule {}
