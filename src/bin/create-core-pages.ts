import fs from "fs";
import path from "path";
import chalk from "chalk";

import { Command } from "../command/Command.js";
import { importTs } from "../utils/importTs.js";
import { getConfig } from "../config/index.js";
import { getAppPacks } from "../appManage/getAppPacks.js";
import { PagesConfig } from "../types/pages.js";
import { getRunCode } from "../utils/global.js";

const COMMAND_NAME = "create-core-pages";

export type CreateCorePagesOptions = {};

export class CreateCorePagesCommand extends Command {
  constructor() {
    super({
      name: COMMAND_NAME,
      description: "创建 core 页面",
    });
  }

  async setUp() {
    return {
      onAction: async () => {
        await createCorePages();
      },
    };
  }

  static getRunCode(options: CreateCorePagesOptions) {
    return getRunCode(COMMAND_NAME, options);
  }
}

async function createCorePages() {
  const { createCorePagesHandler } = await getConfig();

  const currentCWDDir = process.cwd();

  console.log(chalk.yellow(`开始创建页面[core]\ncwd: ${currentCWDDir}`));

  const pagesTsPath = path.join(currentCWDDir, "./src/pages.ts");

  if (!fs.statSync(pagesTsPath, { throwIfNoEntry: false })?.isFile()) {
    console.error(chalk.red(`${pagesTsPath} 不存在`));
    return;
  }

  const pagesDir = path.join(currentCWDDir, "./src/pages");

  if (!fs.statSync(pagesDir, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(chalk.red(`${pagesDir} 不存在`));
    return;
  }

  const { default: config }: { default: PagesConfig } = await importTs(pagesTsPath);

  const pages = getAppPacks(config)
    .map((pack) => {
      return pack.pages.map((page) => {
        return {
          ...page,
          root: pack.root,
        };
      });
    })
    .flat();

  for (let page of pages) {
    const pageComPath = path.join(pagesDir, page.path);
    if (!fs.statSync(path.dirname(pageComPath), { throwIfNoEntry: false })?.isDirectory()) {
      fs.mkdirSync(path.dirname(pageComPath), {
        recursive: true,
      });
    }
    await createCorePagesHandler?.(pageComPath, page.pageConfig);
  }
}
