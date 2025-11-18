#!/usr/bin/env node
import chalk from "chalk";
import fs from "fs";
import path from "path";

import { PagesConfig } from "../types/pages.js";

/**
 * 复制插件到分包目录
 */
async function copyPlugin() {
  const projectPath = process.cwd();

  console.log(chalk.yellow("开始复制插件到分包目录"), projectPath);

  const packagePath = path.join(projectPath, "dist/build/mp-weixin");
  const pagesPath = path.join(projectPath, "src", "pages.json");

  const pagesJSON: PagesConfig = JSON.parse(
    fs
      .readFileSync(pagesPath, "utf8")
      .toString()
      // 删除注释
      .replace(/\/\/.*?\n/g, "")
  );

  pagesJSON.subPackages?.forEach((subPackage) => {
    if (subPackage.plugins) {
      Object.values(subPackage.plugins).forEach((value) => {
        const from = path.join(projectPath, "src", value.export);
        const to = path.join(packagePath, subPackage.root, value.export);
        if (!fs.statSync(from, { throwIfNoEntry: false })?.isFile()) {
          console.error(chalk.red(`插件 ${value.export} 不存在, ${from}`));
          return;
        }
        fs.copyFileSync(from, to);
        console.log(chalk.green(`插件 ${value.export} 复制成功, ${from} to ${to}`));
      });
    }
  });
}

copyPlugin();
