import { Loader } from "../appManage/loader/type.js";
import { AppPackConfig } from "./appPackConfig.js";
import { ToPromise } from "./glob.js";
import { Page } from "./pages.js";
import { BaseCommandOption } from "../command/BaseCommandOption.js";

export interface ProjectConfig {
  /** 命令配置 */
  commands: {
    [key: string]: {
      description: string;
      setUp: () => ToPromise<{
        options: BaseCommandOption[];
        onAction: () => ToPromise<void>;
      }>;
    };
  };
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
    /**
     * 获取 HBuilderX 账号
     */
    getHBuilderXAccount?: () => ToPromise<{
      username: string;
      password: string;
    }>;
  };
  /** apps 目录 */
  appsDir: string;
  apps: AppConfig[];
  /** app配置 */
  app?: {
    getPackConfig: (appConfig: AppConfigExtend) => ToPromise<AppPackConfig>;
  };
  /** 分发 app */
  distributionApp?: {
    /** 加载器 */
    loaders?: Loader[];
    /** 获取 app 的 scripts */
    getAppScripts?: (appConfig: AppConfigExtend) => Record<string, string>;
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
    logsDir: string;
    corePackageDir: string;
    appShellsDir: string;
  };
}

export interface AppConfig<AppEnv extends any = any> {
  /** app名字 */
  name: string;
  /** uniapp 壳类型 */
  uniappShellType: "app" | "h5" | "mp";
  /** app 目录名称 */
  dirName: string;
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
  /** app 绝对路径 全局唯一 */
  path: string;
  /** app 标识颜色 */
  signColor: string;
}
