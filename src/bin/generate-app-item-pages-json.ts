import chalk from "chalk";
import fs from "fs";
import path from "path";

import { importTs } from "../utils/importTs.js";
import { PagesConfig } from "../types/pages.js";
import { Command } from "../command/Command.js";
import { getRunCode } from "../utils/global.js";

const COMMAND_NAME = "generate-app-item-pages-json";

export type GenerateAppItemPagesJsonOptions = {};

export class GenerateAppItemPagesJsonCommand extends Command {
  constructor() {
    super({
      name: COMMAND_NAME,
      description: "生成 app 项 pages.json 文件",
    });
  }

  async setUp() {
    return {
      onAction: async () => {
        await generateAppPagesJson();
      },
    };
  }

  static getRunCode(options: GenerateAppItemPagesJsonOptions) {
    return getRunCode(COMMAND_NAME, options);
  }
}

async function generateAppPagesJson() {
  const currentCWDDir = process.cwd();

  const pagesTsPath = path.join(currentCWDDir, "./src/pages.ts");

  if (!fs.statSync(pagesTsPath, { throwIfNoEntry: false })?.isFile()) {
    console.error(chalk.red(`${pagesTsPath} 不存在`));
    return;
  }

  const { default: pagesConfig }: { default: PagesConfig } = await importTs(pagesTsPath);

  const outputPath = path.join(currentCWDDir, "./src/pages.json");

  fs.writeFileSync(outputPath, JSON.stringify(pagesConfig, null, 2));

  console.log(chalk.green(`${outputPath} 创建成功`));
}
