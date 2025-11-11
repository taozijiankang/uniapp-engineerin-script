/**
 * app pack 配置
 * 文档：https://hx.dcloud.net.cn/cli/pack
 */
export interface AppPackConfig {
  //项目名字或项目绝对路径
  project: string;
  //打包平台 默认值android  值有"android","ios" 如果要打多个逗号隔开打包平台
  platform: string;
  //是否使用自定义基座 默认值false  true自定义基座 false自定义证书
  iscustom: boolean;
  //打包方式是否为安心打包默认值false,true安心打包,false传统打包
  safemode: boolean;
  //android打包参数
  android: {
    //安卓包名
    packagename: string;
    //安卓打包类型 默认值0 0 使用自有证书 1 使用公共证书 2 使用老版证书 3 使用云端证书
    androidpacktype: "0" | "1" | "2" | "3";
    //安卓使用自有证书自有打包证书参数
    //安卓打包证书别名,自有证书打包填写的参数
    certalias: string;
    //安卓打包证书文件路径,自有证书打包填写的参数
    certfile: string;
    //安卓打包证书密码,自有证书打包填写的参数
    certpassword: string;
    //安卓打包证书库密码（HBuilderx4.41支持）,自有证书打包填写的参数
    storePassword: string;
    //安卓平台要打的渠道包 取值有"google","yyb","360","huawei","xiaomi","oppo","vivo"，如果要打多个逗号隔开
    channels: string;
  };
  //ios打包参数
  ios: {
    //ios appid
    bundle: string;
    //ios打包支持的设备类型 默认值iPhone 值有"iPhone","iPad" 如果要打多个逗号隔开打包平台
    supporteddevice: string;
    //iOS使用自定义证书打包的profile文件路径
    profile: string;
    //iOS使用自定义证书打包的p12文件路径
    certfile: string;
    //iOS使用自定义证书打包的证书密码
    certpassword: string;
  };
  //是否混淆 true混淆 false关闭
  isconfusion: boolean;
  //开屏广告 true打开 false关闭
  splashads: boolean;
  //悬浮红包广告true打开 false关闭
  rpads: boolean;
  //push广告 true打开 false关闭
  pushads: boolean;
  //加入换量联盟 true加入 false不加入
  exchange: boolean;
}
