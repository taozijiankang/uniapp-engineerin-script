#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import path from "path";
import fs from "fs";

import { packageJson } from "../packageJson.js";
import { AppStartModeDicts } from "../constants/dicts.js";
import { AppStartMode } from "../constants/enum.js";
import { getConfig } from "../config/index.js";
import { getApps } from "../appManage/getApps.js";
import { runCommand } from "../utils/runCommand.js";
import { AppPackConfigFilePath } from "../constants/index.js";
import { AppConfigExtend } from "../types/config.js";

program.version(packageJson.version).description("启动 uniapp app 项目");

export interface StartAppOptions {
  packageName?: string;
  mode?: string;
}

program
  .command("start-uniapp-app")
  .description("启动 uniapp app 项目")
  .option("-n, --packageName <packageName>", "项目包名")
  .option("-m, --mode <mode>", `模式 可选值：${AppStartModeDicts.map((item) => item.value).join("|")}`)
  .action(async (options: StartAppOptions) => {
    const { packageName, mode } = options;
    const config = await getConfig();
    const appsConfig = getApps(config);

    if (!packageName) {
      console.error(chalk.red("请指定项目包名"));
      return;
    }
    const appConfig = appsConfig.find((item) => item.packageName === packageName);
    if (!appConfig) {
      console.error(chalk.red(`未找到项目: ${packageName}`));
      return;
    }
    if (!mode) {
      console.error(chalk.red(`请指定启动模式(${AppStartModeDicts.map((item) => item.value).join("|")})`));
      return;
    } else {
      if (!AppStartModeDicts.find((item) => item.value === mode)) {
        console.error(chalk.red(`无效的模式: ${mode}`));
        return;
      }
    }

    await startApp({
      appConfig,
      mode: mode as AppStartMode,
    });
  });

program.parse(process.argv);

export async function startApp(options: { appConfig: AppConfigExtend; mode: AppStartMode }) {
  const { appConfig, mode } = options;

  const config = await getConfig();

  const HBuilderXAccount = await Promise.resolve(config.HBuilderX?.getHBuilderXAccount?.());

  const cliPath = config.HBuilderX?.cliPath;

  if (!cliPath) {
    console.error(chalk.red("请在项目配置中配置 HBuilderX cli 路径"));
    return;
  }
  if (!fs.statSync(cliPath, { throwIfNoEntry: false })?.isFile()) {
    console.error(chalk.red(`HBuilderX cli 路径: ${cliPath} 不存在`));
    return;
  }

  console.log("HBuilderX App start", appConfig.key, mode);

  // 先打开HBuilderX
  if (!(await HBuilderXIsOpen(cliPath))) {
    await runCommand(`${cliPath} open`, { stdio: "inherit" });
  }

  // 再登录
  if (HBuilderXAccount?.username && HBuilderXAccount.password) {
    const { stdoutData: userInfo } = await runCommand(`${cliPath} user info`);
    if (!new RegExp(`^${HBuilderXAccount?.username || ""}$`, "m").test(userInfo.toString())) {
      console.log("登录 HBuilderX");
      await runCommand(`${cliPath} user login --username ${HBuilderXAccount.username}  --password ${HBuilderXAccount.password}`, {
        stdio: "inherit",
      });
    }
  }

  // 导入项目
  await runCommand(`${cliPath} project open --path ${appConfig.path}`, { stdio: "inherit" });

  // 开发模式
  if (mode === AppStartMode.DEV) {
    console.log(chalk.green(`已打开HBuilderX并导入项目 ${appConfig.key} ${appConfig.path}`));
  }
  // 构建模式
  else if (mode === AppStartMode.BUILD) {
    console.log(chalk.yellow(`开始云打包项目 ${appConfig.key} ${appConfig.path}`));

    await runCommand(`${cliPath} pack --config ${path.join(appConfig.path, AppPackConfigFilePath)}`, { stdio: "inherit" });
  }
}

export async function HBuilderXIsOpen(cliPath: string) {
  /**
   * 这里用 --help 命令来判断 HBuilderX 是否启动
   * 因为 --help 命令需要启动 HBuilderX 才有结果
   */
  const { stdoutData: helpData } = await runCommand(`${cliPath} --help`);

  return helpData.toString().length > 10;
}
