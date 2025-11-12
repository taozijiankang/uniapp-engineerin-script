import { getConfig } from "../../config/index.js";
import { getApps } from "../../appManage/getApps.js";
import chalk from "chalk";
import { AppStartMode } from "../../constants/enum.js";
import { HBuilderXIsOpen } from "./utils/is.js";
import { runCommand } from "../../utils/runCommand.js";
import path from "path";
import { AppPackConfigFilePath } from "../../constants/index.js";
import fs from "fs";

export async function startApp(options: { packageName: string; mode: AppStartMode }) {
  const { packageName, mode } = options;

  const config = await getConfig();

  const HBuilderXAccount = await Promise.resolve(config.app?.getHBuilderXAccount?.());

  const cliPath = config.HBuilderX?.cliPath;

  if (!cliPath) {
    console.error(chalk.red("请在项目配置中配置 HBuilderX cli 路径"));
    return;
  }

  if (!fs.statSync(cliPath, { throwIfNoEntry: false })?.isFile()) {
    console.error(chalk.red(`HBuilderX cli 路径: ${cliPath} 不存在`));
    return;
  }

  const appsConfig = getApps(config);

  const appConfig = appsConfig.find((item) => item.packageName === packageName);
  if (!appConfig) {
    console.error(chalk.red(`未找到项目: ${packageName}`));
    return;
  }

  console.log("HBuilderX App start", packageName, mode);

  // 先打开HBuilderX
  if (!(await HBuilderXIsOpen(cliPath))) {
    await runCommand(`${cliPath} open`);
  }

  // 再登录
  if (HBuilderXAccount?.username && HBuilderXAccount.password) {
    let userInfo = Buffer.from([]);
    await runCommand(`${cliPath} user info`, {
      handleStdout: (d) => {
        userInfo = Buffer.concat([userInfo, d]);
      },
    });
    if (!new RegExp(`^${HBuilderXAccount?.username || ""}$`, "m").test(userInfo.toString())) {
      console.log("登录 HBuilderX");
      await runCommand(`${cliPath} user login --username ${HBuilderXAccount.username}  --password ${HBuilderXAccount.password}`);
    }
  }

  // 导入项目
  await runCommand(`${cliPath} project open --path ${appConfig.path}`);

  // 开发模式
  if (mode === AppStartMode.DEV) {
    console.log(chalk.green(`已打开HBuilderX并导入项目 ${appConfig.key} ${appConfig.path}`));
  }
  // 构建模式
  else if (mode === AppStartMode.BUILD) {
    console.log(chalk.yellow(`开始云打包项目 ${appConfig.key} ${appConfig.path}`));

    await runCommand(`${cliPath} pack --config ${path.join(appConfig.path, AppPackConfigFilePath)}`);
  }
}
