#!/usr/bin/env node
import { program } from "commander";

import { packageJson } from "../../packageJson.js";
import { AppStartModeDicts } from "../../constants/dicts.js";
import { startApp } from "./startApp.js";
import chalk from "chalk";
import { AppStartMode } from "../../constants/enum.js";

program.version(packageJson.version).description("HBuilderX cli");

export interface StartAppOptions {
  packageName?: string;
  mode?: string;
}

program
  .command("start-app")
  .description("启动 HBuilderX")
  .option("-n, --packageName <packageName>", "项目包名")
  .option("-m, --mode <mode>", `模式 可选值：${AppStartModeDicts.map((item) => item.value).join("|")}`)
  .action(async (options: StartAppOptions) => {
    const { packageName, mode } = options;

    if (!packageName) {
      console.error(chalk.red("请指定项目包名"));
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
      packageName,
      mode: mode as AppStartMode,
    });
  });

program.parse(process.argv);
