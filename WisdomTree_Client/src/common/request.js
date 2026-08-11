import { useTokenStore } from "@/stores/token";

// H5 本地开发用 localhost；小程序端用局域网 IP 访问开发机后端
// #ifdef H5
const BaseUrl = "http://localhost:8080";
// #endif
// #ifdef MP-WEIXIN
const BaseUrl = "http://192.168.0.67:8080";
// #endif

const TreeModelUrl =
  "http://192.168.0.67:8080/static/models/tree_model.glb";

// 创建一个函数来验证RefreshToken然后刷新 AccessToken
const NewAccesstoken = async () => {
  const token = useTokenStore();
  const res = await uni.request({
    url: `${BaseUrl}/auth/refreshAccess`, // 使用 .env 中的变量
    method: "GET",
    header: {
      authorization: `Bearer ${token.RefreshToken}`, // 自定义请求头信息
    },
  });
  if (res.data.status === 200) {
    token.saveToken(res.data.data.accessToken);
    console.log("accessToken 刷新/自动登录成功");
    return true;
  } else {
    console.log("accessToken 刷新/自动登录失败");
    // 提示用户登录过期 需要重新登录
    uni.showToast({
      title: "登录过期",
      icon: "error",
      duration: 2000,
    });
    // 跳转到登录页面
    uni.navigateTo({
      url: "/pages/user/login/login",
    });
    return false;
  }
};

export { NewAccesstoken, BaseUrl, TreeModelUrl };
