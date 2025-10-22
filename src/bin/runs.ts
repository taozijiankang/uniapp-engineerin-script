#!/usr/bin/env node
import chalk from "chalk";
import { program } from "commander";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";

import { packageJson } from "../packageJson.js";
import { runCommand } from "../utils/runCommand.js";
import { getConfig } from "../config/index.js";

const packageScriptDicts = [
  {
    command: "start",
    description: "开始项目",
  },
  {
    command: "app-start",
    description: "启动小程序",
  },
  {
    command: "release",
    description: "发布小程序",
  },
  {
    command: "release:all",
    description: "发布所有小程序",
  },
  {
    command: "cleanup-temp-folders",
    description: "清理临时文件夹",
  },
  {
    command: "open-app-in-wxtool",
    description: "在微信开发者工具中打开项目",
  },
  {
    command: "commit",
    description: "提交代码",
  },
];

interface RunsOptions {
  /** 要执行的命令，多个命令用逗号分隔 */
  commands: string;
}

program
  .version(packageJson.version)
  .description("运行项目脚本")
  .option("-s, --commands <commands>", "要执行的命令，多个命令用逗号分隔")
  .action(() => {
    runs(program.opts());
  })
  .parse(process.argv);

async function runs(args: RunsOptions) {
  const config = await getConfig();

  const { commands = "" } = args;
  const commandsArray = commands
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const runs = [...packageScriptDicts, ...(config.runsScripts || [])];

  /**
   * 如果未指定命令，则询问用户选择要执行的package.json中的命令
   */
  if (commandsArray.length === 0) {
    let { scripts = {} } = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json")).toString()) || {};
    const { command } = await inquirer.prompt([
      {
        message: "选择要执行的npm命令",
        name: "command",
        type: "list",
        default: "dev",
        choices: Object.entries(scripts || {})
          .filter(([key]) => runs.find((item) => item.command === key))
          .map(([key]) => {
            return {
              name: `${runs.find((item) => item.command === key)?.description}: pnpm run ${key}`,
              value: `pnpm run ${key}`,
            };
          }),
      },
    ]);
    commandsArray.push(command);
  }
  for (const command of commandsArray) {
    console.log(chalk.yellow("运行命令: "), chalk.green(command));
    await runCommand(command, { cwd: process.cwd() });
  }
}
