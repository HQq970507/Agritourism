import { createRouter, createWebHistory } from 'vue-router'
import { adminTokenStore } from '@/stores/token'
import DataView from '@/views/dataChart/DataView.vue'
import IndexPage from '@/views/index/IndexPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    // 登录
    {
      path: '/login',
      component: () => import('@/views/login/LoginPage.vue')
    },
    // 数据分析页
    {
      path: '/admindataChart',
      component: IndexPage,
      redirect: '/admindataChart/index',
      children: [
        {
          path: 'index',
          component: DataView
        }
      ]
    },
    // 树类中心
    {
      path: '/adminTreeType',
      component: () => import('@/views/index/IndexPage.vue'),
      redirect: '/adminTreeType/treeTypeCenter',
      children: [
        {
          path: 'treeTypeCenter',
          component: () => import('@/views/treeType/TreeTypeCenter.vue')
        },
        {
          path: 'addTreeType',
          component: () => import('@/views/treeType/AddTreeType.vue')
        },
        {
          path: 'updateTreeType',
          component: () => import('@/views/treeType/UpdateTreeType.vue')
        }
      ]
    },
    // 树中心
    {
      path: '/adminTree',
      component: () => import('@/views/index/IndexPage.vue'),
      redirect: '/adminTree/treeCenter',
      children: [
        {
          path: 'treeCenter',
          component: () => import('@/views/tree/TreeCenter.vue')
        },
        {
          path: 'addTree',
          component: () => import('@/views/tree/AddTree.vue')
        },
        {
          path: 'updateTree',
          component: () => import('@/views/tree/UpdateTree.vue')
        }
      ]
    },
    // 领养中心
    {
      path: '/adminAdopt',
      component: () => import('@/views/index/IndexPage.vue'),
      redirect: '/adminAdopt/adoptCenter',
      children: [
        {
          path: 'adoptCenter',
          component: () => import('@/views/adopt/AdoptCenter.vue')
        },
        {
          path: 'updateAdopt',
          component: () => import('@/views/adopt/UpdateAdopt.vue')
        }
      ]
    },
    // 3D模型
    {
      path: '/admin3dModel',
      component: () => import('@/views/3dModel/ModelView.vue')
    },
    // 3D树模型
    {
      path: '/TreeModel',
      component: () => import('@/views/3dModel/TreeModel.vue')
    },
    // 3D农场模型
    {
      path: '/adminFarm',
      component: () => import('@/views/3dModel/FarmScene.vue')
    },
    // 活动中心
    {
      path: '/adminActivity',
      component: () => import('@/views/index/IndexPage.vue'),
      redirect: '/adminActivity/activityCenter',
      children: [
        {
          path: 'activityCenter',
          component: () => import('@/views/activity/ActivityCenter.vue')
        },
        {
          path: 'addActivity',
          component: () => import('@/views/activity/AddActivity.vue')
        },
        {
          path: 'updateActivity',
          component: () => import('@/views/activity/UpdateActivity.vue')
        }
      ]
    },
    // 产品中心
    {
      path: '/adminProduct',
      component: () => import('@/views/index/IndexPage.vue'),
      redirect: '/adminProduct/productCenter',
      children: [
        {
          path: 'productCenter',
          component: () => import('@/views/product/ProductCenter.vue')
        },
        {
          path: 'addProduct',
          component: () => import('@/views/product/AddProduct.vue')
        },
        {
          path: 'updateProduct',
          component: () => import('@/views/product/UpdateProduct.vue')
        }
      ]
    },
    // 分类中心
    {
      path: '/adminCategory',
      component: () => import('@/views/index/IndexPage.vue'),
      redirect: '/adminCategory/categoryCenter',
      children: [
        {
          path: 'categoryCenter',
          component: () => import('@/views/category/CategoryCenter.vue')
        },
        {
          path: 'addCategory',
          component: () => import('@/views/category/AddCategory.vue')
        },
        {
          path: 'updateCategory',
          component: () => import('@/views/category/UpdateCategory.vue')
        }
      ]
    },
    // 订单中心
    {
      path: '/adminOrder',
      component: () => import('@/views/index/IndexPage.vue'),
      redirect: '/adminOrder/orderCenter',
      children: [
        {
          path: 'orderCenter',
          component: () => import('@/views/order/OrderCenter.vue')
        },
        {
          path: 'updateOrder',
          component: () => import('@/views/order/UpdateOrder.vue')
        }
      ]
    },
    // 文旅线路中心
    {
      path: '/adminTravel',
      component: () => import('@/views/index/IndexPage.vue'),
      redirect: '/adminTravel/routeCenter',
      children: [
        {
          path: 'routeCenter',
          component: () => import('@/views/travel/RouteCenter.vue')
        },
        {
          path: 'facilityCenter',
          component: () => import('@/views/travel/FacilityCenter.vue')
        },
        {
          path: 'reservationCenter',
          component: () => import('@/views/travel/ReservationCenter.vue')
        }
      ]
    },
    // 景区中心
    {
      path: '/adminScenic',
      component: () => import('@/views/index/IndexPage.vue'),
      redirect: '/adminScenic/scenicCenter',
      children: [
        {
          path: 'scenicCenter',
          component: () => import('@/views/scenic/ScenicCenter.vue')
        }
      ]
    },
    // 农户注册
    {
      path: '/farmerRegister',
      component: () => import('@/views/farmer/FarmerRegister.vue')
    },
    // 农户端布局
    {
      path: '/farmerIndex',
      component: () => import('@/views/farmer/FarmerIndex.vue'),
      redirect: '/farmerIndex/dashboard',
      children: [
        {
          path: 'dashboard',
          component: () => import('@/views/farmer/FarmerDashboard.vue')
        },
        {
          path: 'adoptions',
          component: () => import('@/views/farmer/FarmerAdoptions.vue')
        },
        {
          path: 'products',
          component: () => import('@/views/farmer/FarmerProducts.vue')
        },
        {
          path: 'revenue',
          component: () => import('@/views/farmer/FarmerRevenue.vue')
        },
        {
          path: 'profile',
          component: () => import('@/views/farmer/FarmerProfile.vue')
        }
      ]
    },
    // 政府端布局
    {
      path: '/govIndex',
      component: () => import('@/views/gov/GovIndex.vue'),
      redirect: '/govIndex/dashboard',
      children: [
        {
          path: 'dashboard',
          component: () => import('@/views/gov/GovDashboard.vue')
        },
        {
          path: 'farmers',
          component: () => import('@/views/gov/GovFarmers.vue')
        },
        {
          path: 'products',
          component: () => import('@/views/gov/GovProducts.vue')
        },
        {
          path: 'activity',
          component: () => import('@/views/gov/GovActivity.vue')
        },
        {
          path: 'report',
          component: () => import('@/views/gov/GovReport.vue')
        }
      ]
    }
  ]
})

// 添加路由守卫
router.beforeEach((to, from, next) => {
  const tokenStore = adminTokenStore()
  const isAdminRoute = to.path.startsWith('/admin')
  const isFarmerRoute = to.path.startsWith('/farmerIndex')
  const isGovRoute = to.path.startsWith('/govIndex')

  if (isAdminRoute || isFarmerRoute || isGovRoute) {
    // 未登录统一跳转登录页
    if (!tokenStore.RefreshToken) {
      next('/login')
    } else if (isAdminRoute && tokenStore.role === 'farmer') {
      // farmer 角色访问后台时跳回农户首页
      next('/farmerIndex')
    } else if (isAdminRoute && tokenStore.role === 'government') {
      // government 角色访问后台时跳回政府首页
      next('/govIndex')
    } else if (isFarmerRoute && tokenStore.role !== 'farmer') {
      // 非 farmer 角色访问农户端时跳回各自首页
      if (tokenStore.role === 'government') {
        next('/govIndex')
      } else {
        next('/admindataChart/index')
      }
    } else if (isGovRoute && tokenStore.role !== 'government') {
      // 非 government 角色访问政府端时跳回各自首页
      if (tokenStore.role === 'farmer') {
        next('/farmerIndex')
      } else {
        next('/admindataChart/index')
      }
    } else {
      next()
    }
  } else {
    // 登录/注册等非受保护路径直接放行
    next()
  }
})

export default router
