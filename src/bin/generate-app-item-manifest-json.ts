import chalk from "chalk";
import fs from "fs";
import path from "path";

import { importTs } from "../utils/importTs.js";
import { Command } from "../command/Command.js";
import { getRunCode } from "../utils/global.js";

const COMMAND_NAME = "generate-app-item-manifest-json";

export type GenerateAppItemManifestJsonOptions = {};

export class GenerateAppItemManifestJsonCommand extends Command {
  constructor() {
    super({
      name: COMMAND_NAME,
      description: "生成 app 项 manifest.json 文件",
    });
  }

  async setUp() {
    return {
      onAction: async () => {
        await generateAppItemManifestJson();
      },
    };
  }

  static getRunCode(options: GenerateAppItemManifestJsonOptions) {
    return getRunCode(COMMAND_NAME, options);
  }
}

async function generateAppItemManifestJson() {
  const currentCWDDir = process.cwd();

  const pagesTsPath = path.join(currentCWDDir, "./src/manifest.ts");

  if (!fs.statSync(pagesTsPath, { throwIfNoEntry: false })?.isFile()) {
    console.error(chalk.red(`${pagesTsPath} 不存在`));
    return;
  }

  const { default: manifestConfig }: { default: any } = await importTs(pagesTsPath);

  const outputPath = path.join(currentCWDDir, "./src/manifest.json");

  fs.writeFileSync(outputPath, JSON.stringify(manifestConfig, null, 2));

  console.log(chalk.green(`${outputPath} 创建成功`));
}
