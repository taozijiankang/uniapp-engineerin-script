#!/usr/bin/env node
import { program } from "commander";

import { packageJson } from "../packageJson.js";
import inquirer from "inquirer";
import { ConfirmType, ConfirmTypeDicts } from "../constants/index.js";
import { runCommand } from "../utils/runCommand.js";

program.version(packageJson.version).description("HBuilderX cli");

export interface InquiryConfirmOptions {
  message?: string;
  confirmCommand?: string;
  cancelCommand?: string;
}

program
  .command("confirm")
  .description("确认选项")
  .option("-m, --message <message>", "确认选项消息")
  .option("-c, --confirmCommand <confirmCommand>", "确认选项命令")
  .option("-x, --cancelCommand <cancelCommand>", "取消选项命令")
  .action(async (options: InquiryConfirmOptions) => {
    const { confirm }: { confirm: ConfirmType } = await inquirer.prompt([
      {
        type: "list",
        name: "confirm",
        message: options.message || "请选择确认选项",
        default: ConfirmType.NO,
        choices: ConfirmTypeDicts.map((item) => ({
          value: item.value,
          name: item.label,
        })),
      },
    ]);

    if (confirm === ConfirmType.YES) {
      if (options.confirmCommand) {
        await runCommand(options.confirmCommand, { cwd: process.cwd(), stdio: "inherit" });
      }
    } else {
      if (options.cancelCommand) {
        await runCommand(options.cancelCommand, { cwd: process.cwd(), stdio: "inherit" });
      }
    }
  });

program.parse(process.argv);
