# uniapp-engineering-script

一个用于管理 uniapp 项目的工程化脚本工具集，提供项目启动、构建、发布、页面生成等功能。

## 配置文件

### 配置文件获取方式

项目会在当前目录及上层目录中查找名为 `taozi-uniapp-engineering-script-config.mjs` 的配置文件。

### 配置文件类型定义

配置文件需要导出一个符合 `ProjectConfig` 接口的对象：

```typescript
interface ProjectConfig {
  /** 应用配置列表 */
  apps: AppConfig[];
  /** 微信小程序配置 */
  wx?: {
    getAppInfo: (appConfig: AppConfig) => {
      appid: string;
      privateKey: string;
    };
  };
  /** 分发 app */
  distributionApp?: {
    /** 获取 app 的 scripts */
    getAppScripts?: (appConfig: AppConfig) => Record<string, string>;
    /** 加载器 */
    loaders?: Loader[];
  };
  /** 运行脚本配置 */
  runsScripts?: {
    /** 命令 key */
    command: string;
    /** 命令描述 */
    description: string;
  }[];
  /** 环境变量字典 */
  appEnvKeyDicts?: { value: string; label: string }[];
  /** 批量处理app的并发数 */
  appSyncHandleNumber?: number;
  /** 创建 app 页面处理器 */
  createAppPagesHandler?: (pageDir: string, page: Page) => void | Promise<void>;
  /** 创建 core 页面处理器 */
  createCorePagesHandler?: (pageDir: string, page: Page) => void | Promise<void>;
}

interface AppConfig {
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
    name: EnvName;
    /** 环境描述 */
    description: string;
    /** ci机器人编号 1-9 */
    ciRobot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    /** 环境配置 */
    value: AppEnv;
  }[];
  /** 发布配置，用于批量发布小程序 */
  release?: {
    /** 发布类型，体验版 | 正式版本 */
    type: MPVersionTypeValue;
    /** 使用环境 */
    env: EnvName;
  }[];
}

type AppType = "cloud-outpatient" | "internet-hospital";
type EnvName = "production" | "development" | "test";
type MPVersionTypeValue = "trial" | "release";
```

## 命令说明

### taozi-ues-app-start

启动 uniapp 项目，支持开发模式和构建模式。

**参数：**
- `-p, --packageName <packageName>` - 项目package.json中的name字段
- `-m, --mode <mode>` - 模式，可选值：`dev|build`
- `-e, --env <env>` - 环境
- `-o, --openInWXTool <openInWXTool>` - 是否在微信开发者工具中打开，可选值：`yes|no`
- `-u, --upload <upload>` - 是否上传小程序，可选值：`yes|no`
- `-v, --versionType <versionType>` - 上传小程序类型，可选值：`trial|release`
- `-t, --updateVersion <updateVersion>` - 更新版本，可选类型：`none|patch|minor|major`，或者一个版本号，如：1.0.0
- `-c, --ifCreateApp <ifCreateApp>` - 是否创建项目，可选值：`yes|no`

**示例：**
```bash
taozi-ues-app-start -p my-app -m dev -e development
```

### taozi-ues-cleanup-temp-folders

清理临时文件夹。

**参数：** 无

**示例：**
```bash
taozi-ues-cleanup-temp-folders
```

### taozi-ues-copy-plugin

复制插件到分包目录。

**参数：** 无

**示例：**
```bash
taozi-ues-copy-plugin
```

### taozi-ues-create-app-pages

创建应用页面。

**参数：** 无

**示例：**
```bash
taozi-ues-create-app-pages
```

### taozi-ues-create-core-pages

创建核心页面。

**参数：** 无

**示例：**
```bash
taozi-ues-create-core-pages
```

### taozi-ues-elder-transform

对小程序进行老年化适配转换，包括添加 page-meta 和转换字体大小。

**参数：** 无

**示例：**
```bash
taozi-ues-elder-transform
```

### taozi-ues-generate-app-item-pages-json

根据 pages.ts 配置生成 pages.json 文件。

**参数：** 无

**示例：**
```bash
taozi-ues-generate-app-item-pages-json
```

### taozi-ues-open-app-in-wxtool

在微信开发者工具中打开项目。

**参数：**
- `-p, --appPath <appPath>` - 项目路径
- `-t, --openType <openType>` - 打开类型，可选值：`dev|build`

**示例：**
```bash
taozi-ues-open-app-in-wxtool -p /path/to/app -t dev
```

### taozi-ues-release

批量发布项目。

**参数：**
- `-s, --apps <apps>` - 要发布的项目，多个项目用逗号分隔，query 参数格式：`packageName=xxx&env=xxx&type=xxx&version=xxx`
- `-a, --all` - 是否发布所有项目

**示例：**
```bash
taozi-ues-release -s "my-app&env=production&type=release&version=1.0.0"
taozi-ues-release -a
```

### taozi-ues-runs

运行项目脚本。

**参数：**
- `-s, --commands <commands>` - 要执行的命令，多个命令用逗号分隔

**示例：**
```bash
taozi-ues-runs -s "start,test"
```

### taozi-ues-start

启动主流程，包括创建页面和选择启动类型。

**参数：** 无

**示例：**
```bash
taozi-ues-start
```

### taozi-ues-test

测试命令。

**参数：** 无

**示例：**
```bash
taozi-ues-test
```

## 安装和使用

1. 安装依赖：
```bash
pnpm install
```

2. 构建项目：
```bash
pnpm run build-w
```

3. 在项目根目录创建配置文件 `taozi-uniapp-engineering-script-config.mjs`

4. 使用相应的命令进行项目操作

## 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 作者

Taozi
