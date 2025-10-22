#!/usr/bin/env node
import { program } from "commander";
import fuzzy from "fuzzy";
import inquirer from "inquirer";
// @ts-expect-error
import autocompletePrompt from "inquirer-autocomplete-prompt";
import path from "path";

import { OpenWxToolTypeDicts } from "../constants/index.js";
import { packageJson } from "../packageJson.js";
import { hasDir } from "../utils/global.js";
import { openWXTool } from "../utils/openWXTool.js";
import { getApps } from "../appManage/getApps.js";
import { getConfig } from "../config/index.js";
import chalk from "chalk";

inquirer.registerPrompt("autocomplete", autocompletePrompt);

interface OpenAppInWxToolOptions {
  /** 项目路径 */
  appPath: string;
  /** 打开类型 */
  openType: string;
}

program
  .version(packageJson.version)
  .description("在微信开发者工具中打开项目")
  .option("-p, --appPath <appPath>", "项目路径")
  .option("-t, --openType <openType>", `打开类型，可选值：${OpenWxToolTypeDicts.map((item) => item.value).join("|")}`)
  .action(() => {
    openAppInWxTool(program.opts());
  })
  .parse(process.argv);

async function openAppInWxTool(args: OpenAppInWxToolOptions) {
  const config = await getConfig();
  if (!args.appPath) {
    const appsConfig = getApps(config);
    const packageNameList = appsConfig.map((app) => ({
      value: app.packageName,
      name: `${app.description || app.packageName} @${path.relative(config.dirs.rootDir, app.path)}`,
    }));
    const { packageName } = await inquirer.prompt([
      {
        type: "autocomplete",
        name: "packageName",
        message: `请选择要打开微信开发者工具的项目(${packageNameList.length})：`,
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
    const { path: appPath = "" } = appsConfig.find((app) => app.packageName === packageName) || {};
    args.appPath = appPath;
  } else {
    if (!(await hasDir(args.appPath))) {
      throw new Error(`项目路径: ${args.appPath} 不存在`);
    }
  }
  if (!args.openType) {
    const { openType } = await inquirer.prompt([
      {
        type: "list",
        name: "openType",
        message: "请选择打开类型",
        choices: OpenWxToolTypeDicts,
      },
    ]);
    args.openType = openType;
  } else {
    if (!OpenWxToolTypeDicts.find((item) => item.value === args.openType)) {
      throw new Error(`打开类型: ${args.openType} 不存在`);
    }
  }
  const openPath = path.join(args.appPath, "dist", args.openType, "mp-weixin");
  const res = await openWXTool(openPath);
  console.log(chalk.green("微信开发者工具 打开项目成功"), res);
}
