#!/usr/bin/env node
import chalk from "chalk";
import { program } from "commander";
import fs from "fs";
import fuzzy from "fuzzy";
import inquirer from "inquirer";
// @ts-expect-error
import autocompletePrompt from "inquirer-autocomplete-prompt";
import path from "path";

import {
  AppStartMode,
  AppStartModeDicts,
  ConfirmType,
  ConfirmTypeDicts,
  UpdateVersionNumType,
  UpdateVersionNumTypeDicts,
} from "../constants/index.js";
import { packageJson } from "../packageJson.js";
import { openWXTool } from "../utils/openWXTool.js";
import { runCommand } from "../utils/runCommand.js";
import { uploadMp } from "../utils/uploadMp.js";
import { getConfig } from "../config/index.js";
import { getApps } from "../appManage/getApps.js";
import { createApps } from "../appManage/createApps.js";

inquirer.registerPrompt("autocomplete", autocompletePrompt);

interface AppStartOptions {
  /** 项目名称 */
  packageName: string;
  /**  模式 */
  mode: string;
  /**  环境 */
  env: string;
  /**  是否在微信开发者工具中打开 */
  openInWXTool: string;
  /**  是否上传小程序 */
  upload: string;
  /** 小程序版本类型 */
  appVersionType: string;
  /** 更新版本号类型 */
  updateVersionNumType: string;
  /** 是否创建项目 */
  ifCreateApp: string;
}

program
  .version(packageJson.version)
  .description("启动 uni app 项目")
  .option("-p, --packageName <packageName>", "项目package.json中的name字段")
  .option("-m, --mode <mode>", `模式，可选值：${AppStartModeDicts.map((item) => item.value).join("|")}`)
  .option("-e, --env <env>", "环境")
  .option(
    "-o, --openInWXTool <openInWXTool>",
    `是否在微信开发者工具中打开，可选值：${ConfirmTypeDicts.map((item) => item.value).join("|")}`
  )
  .option("-u, --upload <upload>", `是否上传小程序，可选值：${ConfirmTypeDicts.map((item) => item.value).join("|")}`)
  .option(
    "-t, --updateVersionNumType <updateVersionNumType>",
    `更新版本号类型，可选值：${UpdateVersionNumTypeDicts.map((item) => item.value).join("|")}`
  )
  .option("-c, --ifCreateApp <ifCreateApp>", `是否创建项目，可选值：${ConfirmTypeDicts.map((item) => item.value).join("|")}`)
  .action(() => {
    appStart(program.opts());
  })
  .parse(process.argv);

async function appStart(args: AppStartOptions) {
  const config = await getConfig();

  const appsConfig = getApps(config);

  // 如果未指定项目，则使用交互式提示
  if (!args.packageName) {
    const packageNameList = appsConfig.map((app) => ({
      value: app.packageName,
      name: `[${app.index.toString().padStart(appsConfig.length.toString().length, "0")}] ${
        app.description || app.packageName
      } ${path.relative(config.dirs.rootDir, app.path)}`,
    }));
    const { packageName } = await inquirer.prompt([
      {
        type: "autocomplete",
        name: "packageName",
        message: `请选择要启动的项目(${packageNameList.length})：`,
        source: (_: any, input: string) => {
          input = (input || "").trim();
          return fuzzy
            .filter(input, packageNameList, {
              extract: (item) => item.name,
            })
            .map((item) => item.original);
        },
      },
    ]);
    args.packageName = packageName;
  } else {
    if (!appsConfig.find((app) => app.packageName === args.packageName)) {
      throw new Error(`未找到项目: ${args.packageName}`);
    }
  }

  const onSelectAppConfig = appsConfig.find((app) => app.packageName === args.packageName);
  if (!onSelectAppConfig) {
    throw new Error(`未找到项目: ${args.packageName}`);
  }

  // 如果未指定模式，则使用交互式提示
  if (!args.mode) {
    const { mode } = await inquirer.prompt([
      {
        type: "list",
        name: "mode",
        message: "请选择启动模式：",
        choices: AppStartModeDicts.map((item) => ({
          value: item.value,
          name: item.label,
        })),
      },
    ]);
    args.mode = mode;
  } else {
    if (!AppStartModeDicts.find((item) => item.value === args.mode)) {
      throw new Error(`无效的模式: ${args.mode}`);
    }
  }

  // 如果未指定环境，则使用交互式提示
  if (!args.env) {
    const { env } = await inquirer.prompt([
      {
        type: "list",
        name: "env",
        message: "请选择环境：",
        choices:
          onSelectAppConfig.envs?.map((env) => ({
            value: env.name,
            name: env.description,
          })) || [],
      },
    ]);
    args.env = env;
  } else {
    if (!onSelectAppConfig.envs?.find((env) => env.name === args.env)) {
      throw new Error(`无效的环境: ${args.env}`);
    }
  }

  if (args.mode === AppStartMode.BUILD) {
    args.openInWXTool = ConfirmType.NO;
  }
  if (!args.openInWXTool) {
    if (!!config.wx) {
      const { openInWXTool } = await inquirer.prompt([
        {
          type: "list",
          name: "openInWXTool",
          message: "是否在微信开发者工具中打开（需要先启动微信开发者工具）？",
          default: ConfirmType.YES,
          choices: ConfirmTypeDicts.map((item) => ({
            value: item.value,
            name: item.label,
          })),
        },
      ]);
      args.openInWXTool = openInWXTool;
    }
  } else {
    if (!ConfirmTypeDicts.find((item) => item.value === args.openInWXTool)) {
      throw new Error(`无效的打开微信开发者工具确认类型: ${args.openInWXTool}`);
    }
  }

  if (!!config.wx && args.mode === AppStartMode.BUILD) {
    if (!args.upload) {
      const { upload } = await inquirer.prompt([
        {
          type: "list",
          name: "upload",
          message: "是否上传小程序？",
          default: ConfirmType.NO,
          choices: ConfirmTypeDicts.map((item) => ({
            value: item.value,
            name: item.label,
          })),
        },
      ]);
      args.upload = upload;
    } else {
      if (!ConfirmTypeDicts.find((item) => item.value === args.upload)) {
        throw new Error(`无效的上传确认类型: ${args.upload}`);
      }
    }
    if (args.upload === ConfirmType.YES) {
      if (!args.updateVersionNumType) {
        const { updateVersionNumType } = await inquirer.prompt([
          {
            type: "list",
            name: "updateVersionNumType",
            message: "请选择更新版本号类型：",
            default: UpdateVersionNumType.PATCH,
            choices: UpdateVersionNumTypeDicts.map((item) => ({
              value: item.value,
              name: item.label,
            })),
          },
        ]);
        args.updateVersionNumType = updateVersionNumType;
      } else {
        if (!UpdateVersionNumTypeDicts.find((item) => item.value === args.updateVersionNumType)) {
          throw new Error(`无效的更新版本号类型: ${args.updateVersionNumType}`);
        }
      }
    }
  }

  if (args.ifCreateApp !== ConfirmType.NO) {
    console.log(chalk.green("\n创建app项目"), onSelectAppConfig.name, onSelectAppConfig.path);
    await createApps(
      appsConfig.filter((item) => item.packageName === args.packageName),
      {
        appPackageDir: config.dirs.appPackageDir,
        appSyncHandleNumber: config.appSyncHandleNumber,
        appEnvKeyDicts: config.appEnvKeyDicts,
        distributionApp: config.distributionApp,
        wxConfig: config.wx,
      }
    );
    console.log(chalk.green("\n安装app项目依赖"));
    await runCommand("pnpm i", {
      cwd: config.dirs.appsContainerDir,
    });
  }

  if (!!config.wx && args.openInWXTool === ConfirmType.YES) {
    const appWPDistDir = path.join(onSelectAppConfig.path || "", `dist/${args.mode}/mp-weixin`);
    const startTime = Date.now();
    const f = () => {
      setTimeout(() => {
        if (fs.statSync(path.join(appWPDistDir, "project.config.json"), { throwIfNoEntry: false })?.isFile()) {
          openWXTool(appWPDistDir)
            .then((res) => {
              console.log(chalk.green("\n微信开发者工具 启动小程序成功"), res);
            })
            .catch((error) => {
              // 10分钟取消轮询
              if (Math.abs(Date.now() - startTime) < 1000 * 60 * 10) {
                f();
              } else {
                console.error(chalk.red("\n微信开发者工具 启动小程序失败"), error);
              }
            });
        } else {
          f();
        }
      }, 1000);
    };
    f();
  }

  // 构建命令
  const command = `pnpm --filter ${args.packageName} ${args.mode}:${args.env}`;

  console.log(chalk.green("\n执行命令:"), command);

  await runCommand(command, {
    cwd: config.dirs.appsContainerDir,
    env: {
      APP_START_MODE: args.mode,
    },
  });

  if (!!config.wx && args.mode === AppStartMode.BUILD && args.upload === ConfirmType.YES) {
    console.log(chalk.yellow("\n开始上传小程序"));

    const { appid, privateKey } = config.wx.getAppInfo(onSelectAppConfig);
    if (!appid || !privateKey) {
      throw new Error(`微信小程序id或私钥未配置: ${onSelectAppConfig.name} ${onSelectAppConfig.description}`);
    }
    await uploadMp({
      appConfig: onSelectAppConfig,
      env: args.env,
      updateVersionNumType: args.updateVersionNumType as UpdateVersionNumType,
      appid,
      privateKey,
    });

    console.log(chalk.green("\n上传小程序成功"));
  }

  process.exit();
}
