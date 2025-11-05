#!/usr/bin/env node
import chalk from "chalk";
import inquirer from "inquirer";

import { runCommand } from "../utils/runCommand.js";
import { getConfig } from "../config/index.js";

runs();

async function runs() {
  const config = await getConfig();

  const runsCommands = config.runsCommands || [];

  if (runsCommands.length === 0) {
    console.log(chalk.yellow("没有可执行的命令"));
    return;
  }

  const { command } = await inquirer.prompt([
    {
      message: "选择要执行的命令",
      name: "command",
      type: "list",
      choices: runsCommands.map((item) => ({
        name: `${item.command}: ${item.description}`,
        value: item.command,
      })),
    },
  ]);

  console.log(chalk.yellow("运行命令: "), chalk.green(command));
  await runCommand(command, { cwd: process.cwd() });
}
