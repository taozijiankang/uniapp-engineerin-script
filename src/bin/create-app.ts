import chalk from "chalk";

import { getProjectConfigExtend } from "../config/index.js";
import { createApps } from "../appManage/createApps.js";
import { Command } from "../command/Command.js";
import { StringCommandOption } from "../command/BaseCommandOption.js";
import { getRunCode } from "../utils/global.js";

const COMMAND_NAME = "create-app";

export type CreateAppOptions = {
  packageNames: string;
};

export class CreateAppCommand extends Command {
  constructor() {
    super({
      name: COMMAND_NAME,
      description: "创建 app 项目",
    });
  }

  async setUp() {
    const packageNamesOption = new StringCommandOption({
      name: "packageNames",
      description: "项目包名，多个包名用逗号隔开",
      defValue: "",
    });

    return {
      options: [packageNamesOption],
      onAction: async () => {
        const packageNamesStr = packageNamesOption.value;

        if (!packageNamesStr) {
          console.error(chalk.red("请指定项目包名，多个包名用逗号隔开"));
          return;
        }

        const packageNames = packageNamesStr
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        const config = await getProjectConfigExtend();
        const { apps: appsConfig } = config;
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
      },
    };
  }

  static getRunCode(options: CreateAppOptions) {
    return getRunCode(COMMAND_NAME, options);
  }
}
