#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";

import { packageJson } from "../packageJson.js";
import { getConfig } from "../config/index.js";
import { getApps } from "../appManage/getApps.js";
import { createApps } from "../appManage/createApps.js";

program.version(packageJson.version).description("启动 uniapp app 项目");

export interface StartAppOptions {
  packageNames?: string;
}

program
  .description("创建 app 项目")
  .option("-n, --packageNames <packageNames>", "项目包名，多个包名用逗号隔开")
  .action(async (options: StartAppOptions) => {
    const { packageNames: packageNamesStr } = options;

    if (!packageNamesStr) {
      console.error(chalk.red("请指定项目包名，多个包名用逗号隔开"));
      return;
    }

    const packageNames = packageNamesStr
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const config = await getConfig();
    const appsConfig = getApps(config);
    const appConfigs = appsConfig.filter((item) => packageNames.includes(item.packageName));

    if (appConfigs.length === 0) {
      console.error(chalk.red("未找到项目"));
      return;
    }

    await createApps(appConfigs, {
      appShellsDir: config.dirs.appShellsDir,
      appSyncHandleNumber: config.appSyncHandleNumber,
      appEnvKeyDicts: config.appEnvKeyDicts,
      distributionApp: config.distributionApp,
      opAppConfig: config.app,
    });
  });

program.parse(process.argv);
