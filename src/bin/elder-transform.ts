#!/usr/bin/env node
import chalk from "chalk";
import fs from "fs";
import path from "path";

async function elderTransform() {
  const currentCWDDir = process.cwd();

  const workspaceRoot = currentCWDDir.split("apps")[0];
  const projectPath = currentCWDDir.replace(workspaceRoot + "apps" + path.sep, "");

  if (!projectPath) {
    console.log(chalk.red("无法确定项目路径，请确保在项目目录下执行此命令"));
    return;
  }

  const baseDir = path.join(currentCWDDir, "dist/build/mp-weixin");
  if (!fs.existsSync(baseDir)) {
    console.log(chalk.red(`目录不存在: ${baseDir}`));
    return;
  }

  const insertLine = '<page-meta root-font-size="system"/>\n';

  /**
   * 获取所有指定扩展名文件
   * @param dir 目录
   * @param ext 扩展名
   * @param fileList 文件列表
   * @returns 文件列表
   */
  function getAllFiles(dir: string, ext: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        getAllFiles(fullPath, ext, fileList);
      } else if (stat.isFile() && file.endsWith(ext)) {
        fileList.push(fullPath);
      }
    });

    return fileList;
  }

  /**
   * 给 .wxml 添加 page-meta
   * @param files 文件列表
   */
  function processWxmlFiles(files: string[]) {
    files.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");
      if (!content.includes('<page-meta root-font-size="system"/>')) {
        const newContent = insertLine + content;
        fs.writeFileSync(file, newContent, "utf8");
      }
    });
  }

  /**
   * 替换 font-size 的 rpx 数值为 calc(...)，保留其它格式与标记
   * @param files 文件列表
   */
  function processWxssFiles(files: string[]) {
    // 匹配 font-size: 到 ; 之间的部分，再查找其中的 \d+rpx 并替换
    const fontSizeBlockRegex = /font-size\s*:[^;]*\d+rpx[^;]*;/gi;
    const rpxValueRegex = /(\d+)\s*rpx/gi;

    files.forEach((file) => {
      let content = fs.readFileSync(file, "utf8");
      let replaced = false;

      const newContent = content.replace(fontSizeBlockRegex, (match) => {
        // 替换其中的数字rpx为 calc(...) 形式
        const updated = match.replace(rpxValueRegex, (_, num) => {
          replaced = true;
          return `calc(${num}rpx + 0.5 * (1rem - 16px))`;
        });
        return updated;
      });

      if (replaced) {
        fs.writeFileSync(file, newContent, "utf8");
      }
    });
  }

  // 执行流程
  console.log(chalk.yellow("开始执行 elder-transform"));

  console.log(chalk.yellow("开始处理目录: " + baseDir));

  const wxmlFiles = getAllFiles(baseDir, ".wxml");
  const wxssFiles = getAllFiles(baseDir, ".wxss");

  processWxmlFiles(wxmlFiles);
  processWxssFiles(wxssFiles);

  console.log(chalk.green(`✨ 全部处理完成：WXML ${wxmlFiles.length} 个，WXSS ${wxssFiles.length} 个`));

  console.log(chalk.green("elder-transform 执行完成"));
}

elderTransform();
