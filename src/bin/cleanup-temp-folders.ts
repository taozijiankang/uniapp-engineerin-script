import fs from "fs";
import path from "path";
import chalk from "chalk";

import { Command } from "../command/Command.js";
import { StringCommandOption } from "../command/BaseCommandOption.js";
import { getRunCode } from "../utils/global.js";

const COMMAND_NAME = "cleanup-temp-hash-folders";

export type CleanupTempHashFoldersOptions = {
  targetDir?: string;
};

export class CleanupTempHashFoldersCommand extends Command {
  constructor() {
    super({
      name: COMMAND_NAME,
      description: "清理临时文件夹",
    });
  }

  async setUp() {
    const targetDirOption = new StringCommandOption({
      name: "targetDir",
      description: "目标目录",
      defValue: process.cwd(),
    });

    return {
      options: [targetDirOption],
      onAction: async () => {
        const targetDir = targetDirOption.value;
        if (!targetDir) {
          console.error(chalk.red("目标目录不能为空"));
          return;
        }
        if (!fs.statSync(targetDir, { throwIfNoEntry: false })?.isDirectory()) {
          console.error(chalk.red(`目标目录不存在: ${targetDir}`));
          return;
        }
        await cleanupTempHashFolders(targetDir);
      },
    };
  }

  static getRunCode(options: CleanupTempHashFoldersOptions) {
    return getRunCode(COMMAND_NAME, options);
  }
}

async function cleanupTempHashFolders(targetDir: string) {
  const files = fs.readdirSync(targetDir);

  // 匹配32位十六进制哈希值命名的文件夹
  const hashPattern = /^[a-f0-9]{32}$/;

  files.forEach((file) => {
    const fullPath = path.join(targetDir, file);
    if (
      hashPattern.test(file) &&
      fs.statSync(fullPath, { throwIfNoEntry: false })?.isDirectory() &&
      // 如果文件夹不为空，则不删除
      fs.readdirSync(fullPath).length === 0
    ) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ 已删除临时文件夹: ${file}`);
      } catch (err) {
        console.error(`❌ 删除临时文件夹失败: ${file}`, err);
      }
    }
  });
}
