#!/usr/bin/env node
import fs from "fs";
import path from "path";

import { importTs } from "../utils/importTs.js";
import { getConfig } from "../config/index.js";
import { getAppPacks } from "../appManage/getAppPacks.js";
import chalk from "chalk";
import { PagesConfig } from "../types/pages.js";

async function createCorePages() {
  const { createCorePagesHandler } = await getConfig();

  const currentCWDDir = process.cwd();

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

createCorePages();
