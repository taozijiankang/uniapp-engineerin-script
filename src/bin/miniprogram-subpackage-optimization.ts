#!/usr/bin/env node
import miniprogramSubpackageOptimization from "../miniprogram-subpackage-optimization/index.js";
import { program } from "commander";
import { packageJson } from "../packageJson.js";

interface IMiniprogramSubpackageOptimizationOptions {
  projectDistPath?: string;
  originDirName?: string;
  targetDirTag?: string;
}

program
  .version(packageJson.version)
  .description("小程序分包优化")
  .option("-p, --project-dist-path <path>", "项目构建目录路径")
  .option("-o, --origin-dir-name <name>", "原始 node-modules 目录名称")
  .option("-t, --target-dir-tag <tag>", "目标目录标签")
  .action(() => {
    const options: IMiniprogramSubpackageOptimizationOptions = program.opts();

    miniprogramSubpackageOptimization({
      projectDistPath: options.projectDistPath,
      originDirName: options.originDirName,
      targetDirTag: options.targetDirTag,
    });
  })
  .parse(process.argv);
