#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";

import { AppStartModeDicts } from "../constants/dicts.js";
import { packageJson } from "../packageJson.js";
import { openWXTool } from "../utils/openWXTool.js";
import { getConfig } from "../config/index.js";
import { getApps } from "../appManage/getApps.js";
import path from "path";

program.version(packageJson.version).description("在微信开发者工具中打开项目");

export interface OpenWxToolOptions {
  packageName?: string;
  mode?: string;
}

program
  .command("open-wx-tool")
  .description("在微信开发者工具中打开项目")
  .option("-n, --packageName <packageName>", "项目包名")
  .option("-m, --mode <mode>", `模式 可选值：${AppStartModeDicts.map((item) => item.value).join("|")}`)
  .action(async (options: OpenWxToolOptions) => {
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
      console.error(chalk.red(`请指定模式(${AppStartModeDicts.map((item) => item.value).join("|")})`));
      return;
    } else {
      if (!AppStartModeDicts.find((item) => item.value === mode)) {
        console.error(chalk.red(`无效的模式: ${mode}`));
        return;
      }
    }
    await openWXTool(path.join(appConfig.path, "dist", mode, "mp-weixin"));
  });
program.parse(process.argv);
