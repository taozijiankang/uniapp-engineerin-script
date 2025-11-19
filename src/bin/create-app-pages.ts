import fs from "fs";
import path from "path";
import chalk from "chalk";

import { importTs } from "../utils/importTs.js";
import { getConfig } from "../config/index.js";
import { getAppPacks } from "../appManage/getAppPacks.js";
import { PagesConfig } from "../types/pages.js";
import { Command } from "../command/Command.js";
import { getRunCode } from "../utils/global.js";

const COMMAND_NAME = "create-app-pages";

export type CreateAppPagesOptions = {};

export class CreateAppPagesCommand extends Command {
  constructor() {
    super({
      name: COMMAND_NAME,
      description: "创建应用页面",
    });
  }

  async setUp() {
    return {
      onAction: async () => {
        await createAppPages();
      },
    };
  }

  static getRunCode(options: CreateAppPagesOptions) {
    return getRunCode(COMMAND_NAME, options);
  }
}

async function createAppPages() {
  const { createAppPagesHandler } = await getConfig();

  const currentCWDDir = process.cwd();

  console.log(chalk.yellow(`开始创建页面[app]\ncwd: ${currentCWDDir}`));

  const pagesTsPath = path.join(currentCWDDir, "./src/pages.ts");

  if (!fs.statSync(pagesTsPath, { throwIfNoEntry: false })?.isFile()) {
    console.error(chalk.red(`${pagesTsPath} 不存在`));
    return;
  }

  const pagesSrcPath = path.join(currentCWDDir, "./src");

  if (!fs.statSync(pagesSrcPath, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(chalk.red(`${pagesSrcPath} 不存在`));
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
    const pagePath = path.join(pagesSrcPath, page.root, page.path);
    if (!fs.statSync(path.dirname(pagePath), { throwIfNoEntry: false })?.isDirectory()) {
      fs.mkdirSync(path.dirname(pagePath), {
        recursive: true,
      });
    }
    await createAppPagesHandler?.(pagePath, page.pageConfig);
  }

  // 删除多余的页面
  fs.readdirSync(pagesSrcPath)
    .filter((item) => fs.statSync(path.join(pagesSrcPath, item), { throwIfNoEntry: false })?.isDirectory())
    .filter((_) => /^pages-?/.test(_))
    .forEach((subPackName) => {
      const subPackPath = path.join(pagesSrcPath, subPackName);
      const subPages = pages.filter((item) => item.root === subPackName);
      if (subPages.length == 0) {
        rmSync(subPackPath, "子包");
        return;
      }
      fs.readdirSync(subPackPath).forEach((pageName) => {
        const pagePath = path.join(subPackPath, pageName);
        let stat = fs.statSync(pagePath, { throwIfNoEntry: false });
        if (stat?.isDirectory()) {
          if (subPages.every((page) => page.path.split("/").filter(Boolean)[0] !== pageName)) {
            rmSync(pagePath);
          }
        } else if (stat?.isFile()) {
          if (pages.every((page) => page.path !== pageName)) {
            rmSync(pagePath);
          }
        }
      });
    });
}

function rmSync(path_: string, title?: string) {
  let stat = fs.statSync(path_, { throwIfNoEntry: false });
  if (stat?.isDirectory()) {
    console.log(chalk.yellow(`删除${title || "目录"}`), path_);
    fs.rmSync(path_, {
      recursive: true,
    });
  } else if (stat?.isFile()) {
    console.log(chalk.yellow(`删除${title || "文件"}`), path_);
    fs.rmSync(path_);
  }
}
