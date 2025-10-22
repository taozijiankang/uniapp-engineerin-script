#!/usr/bin/env node
import chalk from "chalk";
import inquirer from "inquirer";
import path from "path";
import { fileURLToPath } from "url";

import { FailColor, SuccessColor } from "../constants/color.js";
import { ProjectStartType, ProjectStartTypeDicts } from "../constants/index.js";
import { createLog } from "../utils/createLog.js";
import { runCommand } from "../utils/runCommand.js";
import { getConfig } from "../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  const config = await getConfig();

  const log = createLog();

  const runTask = async ({ command, title, color, cwd }: { command: string; title: string; color: string; cwd: string }) => {
    const code = await runCommand(command, {
      cwd,
      handleStdout: (data) => {
        log(data, title, color);
      },
    });
    const mes =
      chalk.bgHex(color)(" ") +
      " " +
      chalk.bgHex(code == 0 ? SuccessColor : FailColor)(`[${title}] ${code == 0 ? "成功" : "失败"}`);
    console.log(mes, "\n");
    return {
      code,
      mes,
    };
  };

  console.log(chalk.yellow("开始 主 流程"), "\n");

  await Promise.all([
    runTask({
      command: `pnpm run create-core-pages`,
      title: "packages/core: pnpm run create-core-pages",
      color: "#f9ed69",
      cwd: config.dirs.corePackageDir,
    }),
    runTask({
      command: `pnpm run create-app-pages`,
      title: "packages/app: pnpm run create-app-pages",
      color: "#f08a5d",
      cwd: config.dirs.appPackageDir,
    }),
  ]);

  const { projectStartType } = await inquirer.prompt([
    {
      type: "list",
      name: "projectStartType",
      message: "请选择项目启动类型：",
      default: ProjectStartType.COMMON,
      choices: ProjectStartTypeDicts.map((item) => ({
        value: item.value,
        name: item.label,
      })),
    },
  ]);

  if (projectStartType === ProjectStartType.COMMON) {
    console.log("启动项目\n");

    await runCommand(`node ${path.join(__dirname, "app-start.js")}`, {
      cwd: config.dirs.rootDir,
    });
  } else {
    console.log("发布项目\n");

    await runCommand(`node ${path.join(__dirname, "release.js")}`, {
      cwd: config.dirs.rootDir,
    });
  }
}

start();
