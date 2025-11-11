#!/usr/bin/env node
import chalk from "chalk";
import inquirer from "inquirer";
import path from "path";
import { fileURLToPath } from "url";
import { program } from "commander";

import { ProjectStartType, ProjectStartTypeDicts } from "../constants/index.js";
import { createLog } from "../utils/createLog.js";
import { runCommand } from "../utils/runCommand.js";
import { getConfig } from "../config/index.js";
import { Colors } from "../constants/color.js";
import { packageJson } from "../packageJson.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StartOptions {
  /** 环境 */
  envs?: string;
  /** 更新版本号类型 */
  updateVersionNumType?: string;
}

program
  .version(packageJson.version)
  .description("开始项目")
  .option("-e, --envs <envs>", "环境，正常模式只会使用第一个")
  .option("-u, --updateVersionNumType <updateVersionNumType>", "更新版本号类型")
  .action(() => {
    start(program.opts());
  })
  .parse(process.argv);

async function start(args: StartOptions) {
  const { envs: argsEnvStr = "", updateVersionNumType: argsUpdateVersionNumType = "" } = args;

  let argsEnvs: string[] = argsEnvStr.split(",").filter(Boolean);

  const config = await getConfig();

  console.log(chalk.yellow("\n开始 主 流程\n"));

  await Promise.all([
    runTask({
      command: `pnpm run start`,
      title: "@packages/core:start",
      color: Colors[0]!,
      cwd: config.dirs.corePackageDir,
    }),
    runTask({
      command: `pnpm run start`,
      title: "@packages/app:start",
      color: Colors[1]!,
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

    await runCommand(
      [
        `node ${path.join(__dirname, "app-start.js")}`,
        argsEnvs.length > 0 ? `-e ${argsEnvs[0]}` : "",
        argsUpdateVersionNumType ? `-t ${argsUpdateVersionNumType}` : "",
      ].join(" "),
      {
        cwd: config.dirs.rootDir,
      }
    );
  } else {
    console.log("发布项目\n");

    await runCommand(
      [
        `node ${path.join(__dirname, "release.js")}`,
        argsEnvs.length > 0 ? `-e ${argsEnvs[0]}` : "",
        argsUpdateVersionNumType ? `-u ${argsUpdateVersionNumType}` : "",
      ].join(" "),
      {
        cwd: config.dirs.rootDir,
      }
    );
  }
}

async function runTask({ command, title, color, cwd }: { command: string; title: string; color: string; cwd: string }) {
  const log = createLog({ title, titleBgColor: color });
  const code = await runCommand(command, {
    cwd,
    handleStdout: (data) => {
      log(data.toString());
    },
  });
  const success = code == 0;
  if (!success) {
    throw new Error();
  }
}
