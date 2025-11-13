#!/usr/bin/env node
import chalk from "chalk";
import fs from "fs";
import path from "path";

import { importTs } from "../utils/importTs.js";

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

generateAppItemManifestJson();
