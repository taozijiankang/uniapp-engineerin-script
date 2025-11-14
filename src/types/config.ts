import { Loader } from "../appManage/loader/type.js";
import { AppPackConfig } from "./appPackConfig.js";
import { ToPromise } from "./glob.js";
import { Page } from "./pages.js";

export interface ProjectConfig {
  /** HBuilderX 配置 */
  HBuilderX?: {
    /**
     * HBuilderX cli 路径
     * ## 命令行工具所在位置:
     * #### Windows: HBuilderX安装目录根目录, cli.exe
     * #### MacOSX:
     * - 正式版 `/Applications/HBuilderX.app/Contents/MacOS/cli`
     * - Alpha版 `/Applications/HBuilderX-Alpha.app/Contents/MacOS/cli`
     * #### Linux: HBuilderX安装目录根目录, cli
     */
    cliPath?: string;
  };
  /** apps 目录 */
  appsDir: string;
  apps: AppConfig[];
  /** 微信小程序配置 */
  wx?: {
    getAppInfo: (appConfig: AppConfigExtend) => ToPromise<{
      appid: string;
      privateKey: string;
    }>;
  };
  /** app配置 */
  app?: {
    getHBuilderXAccount?: () => ToPromise<{
      username: string;
      password: string;
    }>;
    getPackConfig: (appConfig: AppConfigExtend) => ToPromise<AppPackConfig>;
  };
  /** 分发 app */
  distributionApp?: {
    /** 获取 app 的 scripts */
    getAppScripts?: (appConfig: AppConfigExtend) => Record<string, string>;
    /** 加载器 */
    loaders?: Loader[];
  };
  /** 运行命令列表 */
  runsCommands?: {
    /** 命令 */
    command: string;
    /** 命令描述 */
    description: string;
  }[];
  /** 环境变量字典 */
  appEnvKeyDicts?: { value: string; label: string }[];
  /**
   * 批量处理app的并发数
   * TODO: 需要根据项目的体量和机器的性能来调整
   */
  appSyncHandleNumber?: number;
  /**
   * 创建 app 页面
   */
  createAppPagesHandler?: (pagePath: string, page: Page) => ToPromise<void>;
  /**
   * 创建 core 页面
   */
  createCorePagesHandler?: (pagePath: string, page: Page) => ToPromise<void>;
}

export interface ProjectConfigExtend extends ProjectConfig {
  appSyncHandleNumber: number;
  dirs: {
    rootDir: string;
    packagesDir: string;
    corePackageDir: string;
    appPackageDir: string;
    scriptsDir: string;
    logsDir: string;
  };
}

/**
 * app 类型
 * cloud-outpatient 云门诊
 * internet-hospital 互联网医院
 */
export type AppType = "cloud-outpatient" | "internet-hospital";

export interface AppConfig<AppEnv extends any = any> {
  /** app名字 */
  name: string;
  /** app 类型 */
  type: AppType;
  /** 描述 */
  description: string;
  /** 公共环境 */
  comEnv?: AppEnv;
  /** 所有环境 */
  envs?: {
    /** 环境名称 */
    name: string;
    /** 环境描述 */
    description: string;
    /** ci机器人编号 1-30 */
    ciRobot?:
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8
      | 9
      | 10
      | 11
      | 12
      | 13
      | 14
      | 15
      | 16
      | 17
      | 18
      | 19
      | 20
      | 21
      | 22
      | 23
      | 24
      | 25
      | 26
      | 27
      | 28
      | 29
      | 30;
    /** 环境配置 */
    value: AppEnv;
  }[];
}

export interface AppConfigExtend extends AppConfig {
  /** app 索引 */
  index: number;
  /** app 唯一标识 */
  key: string;
  /** app 包名 全局唯一 */
  packageName: string;
  /** app 路径 全局唯一 */
  path: string;
  /** app 标识颜色 */
  signColor: string;
}
