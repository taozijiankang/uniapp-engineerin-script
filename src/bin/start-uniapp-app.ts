import chalk from "chalk";
import fs from "fs";
import path from "path";
import dayjs from "dayjs";
import { parse as JSONParse } from "comment-json";

import { AppStartModeDicts } from "../constants/dicts.js";
import { AppStartMode } from "../constants/enum.js";
import { getProjectConfigExtend } from "../config/index.js";
import { runCommand } from "../utils/runCommand.js";
import { AppConfigExtend } from "../types/config.js";
import { Command } from "../command/Command.js";
import { StringCommandOption } from "../command/BaseCommandOption.js";
import { SelectCommandOption } from "../command/SelectCommandOption.js";
import { getRunCode } from "../utils/global.js";

const COMMAND_NAME = "start-uniapp-app";

export type StartUniappAppOptions = {
  packageName: string;
  mode: AppStartMode;
};

export class StartUniappAppCommand extends Command {
  constructor() {
    super({
      name: COMMAND_NAME,
      description: "启动 uniapp app 项目",
    });
  }
  async setUp() {
    const packageNameOption = new StringCommandOption({
      name: "packageName",
      description: "项目包名",
    });

    const modeOption = new SelectCommandOption({
      name: "mode",
      description: "模式",
      options: AppStartModeDicts.map((item) => ({
        name: item.label,
        value: item.value,
      })),
      selectType: "single",
    });
    return {
      options: [packageNameOption, modeOption],
      onAction: async () => {
        const packageName = packageNameOption.value;
        const mode = modeOption.value;

        if (!packageName) {
          console.error(chalk.red("请指定项目包名"));
          return;
        }
        const config = await getProjectConfigExtend();
        const { apps: appsConfig } = config;
        const appConfig = appsConfig.find((item) => item.packageName === packageName);
        if (!appConfig) {
          console.error(chalk.red(`未找到项目: ${packageName}`));
          return;
        }
        if (!mode) {
          console.error(chalk.red(`请指定启动模式(${AppStartModeDicts.map((item) => item.value).join("|")})`));
          return;
        }

        await startApp({
          appConfig,
          mode: mode as AppStartMode,
          projectPath: config.dirs.rootDir,
        });
      },
    };
  }

  static getRunCode(options: StartUniappAppOptions) {
    return getRunCode(COMMAND_NAME, options);
  }
}

export async function startApp(options: { appConfig: AppConfigExtend; mode: AppStartMode; projectPath: string }) {
  const { appConfig, mode, projectPath } = options;

  const config = await getProjectConfigExtend();

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

  console.log("HBuilderX App start", appConfig.path, mode);

  // 先打开HBuilderX
  if (!(await HBuilderXIsOpen(cliPath))) {
    await runCommand(`${cliPath} open`, { stdio: "inherit" });
  }

  // 登录
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
    console.log(chalk.green(`已打开HBuilderX并导入项目 ${appConfig.path}`));
  }
  // 构建模式
  else if (mode === AppStartMode.BUILD) {
    const commitMessage = await getCommitMessage(projectPath);
    const versionNumber =
      (JSONParse(fs.readFileSync(path.join(appConfig.path, "src/manifest.json"), "utf8").toString() || "{}") as any)
        ?.versionName || "1.0.0";
    const versionName = versionNumber.split(".").join("_");
    const packName = `${appConfig.name}-${versionName}-${commitMessage}-${dayjs().format("YY-MM-DD-HH-mm")}`;
    console.log(chalk.green(`--------------------------------`));
    console.log(chalk.green(`请手动在 HBuilderX 中进行云打包 推荐使用 ${packName} 作为包名`));
    console.log(chalk.green(`--------------------------------`));
  }
}

async function HBuilderXIsOpen(cliPath: string) {
  /**
   * 这里用 --help 命令来判断 HBuilderX 是否启动
   * 因为 --help 命令需要启动 HBuilderX 才有结果
   */
  const { stdoutData: helpData } = await runCommand(`${cliPath} --help`);

  return helpData.toString().length > 10;
}

async function getCommitMessage(projectPath: string) {
  const { stdoutData: commitHash } = await runCommand(`git log -1 --pretty=%h`, {
    cwd: projectPath,
  });
  return commitHash.toString().trim();
}
