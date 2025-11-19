import miniprogramSubpackageOptimization from "../miniprogram-subpackage-optimization/index.js";
import { Command } from "../command/Command.js";
import { StringCommandOption } from "../command/BaseCommandOption.js";
import { getRunCode } from "../utils/global.js";

const COMMAND_NAME = "miniprogram-subpackage-optimization";

export type MiniprogramSubpackageOptimizationOptions = {
  projectDistPath?: string;
  originDirName?: string;
  targetDirTag?: string;
};

export class MiniprogramSubpackageOptimizationCommand extends Command {
  constructor() {
    super({
      name: COMMAND_NAME,
      description: "小程序分包优化",
    });
  }

  async setUp() {
    const projectDistPathOption = new StringCommandOption({
      name: "projectDistPath",
      description: "项目构建目录路径",
    });

    const originDirNameOption = new StringCommandOption({
      name: "originDirName",
      description: "原始 node-modules 目录名称",
    });

    const targetDirTagOption = new StringCommandOption({
      name: "targetDirTag",
      description: "目标目录标签",
    });

    return {
      options: [projectDistPathOption, originDirNameOption, targetDirTagOption],
      onAction: async () => {
        const projectDistPath = projectDistPathOption.value;
        const originDirName = originDirNameOption.value;
        const targetDirTag = targetDirTagOption.value;

        await miniprogramSubpackageOptimization({
          projectDistPath,
          originDirName,
          targetDirTag,
        });
      },
    };
  }

  static getRunCode(options: MiniprogramSubpackageOptimizationOptions) {
    return getRunCode(COMMAND_NAME, options);
  }
}
