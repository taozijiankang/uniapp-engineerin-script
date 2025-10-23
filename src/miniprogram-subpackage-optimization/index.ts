import chalk from "chalk";
import { copySync } from "fs-extra/esm";
import { sync as globbySync } from "globby";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import { deleteOriginNodeModules, deletePackageNodeModulesPageDir, getNeedPackageDirNames, replacePackageFiles } from "./util.js";

export interface IMiniprogramSubpackageOptimizationOptions {
  /**
   * 项目构建目录路径
   * 默认值为 ./dist/build/mp-weixin
   * 如果为绝对路径，则直接使用该路径
   * 如果为相对路径，则相对于当前工作目录
   */
  projectDistPath?: string;
  originDirName?: string;
  targetDirTag?: string;
  vendorPathPattern?: RegExp;
  nodeModulesPathPattern?: RegExp;
  onlyOptimizeMainPackage?: boolean;
}

const defaultVendorPathPattern = /(\.\.\/)+common\/vendor\.js/g;
const defaultNodeModulesPathPattern = /(\.\.\/)+node-modules\/[^"']*/g;

/**
 * 小程序分包优化
 * @param options 小程序分包优化选项
 */
export default async function miniprogramSubpackageOptimization(options: IMiniprogramSubpackageOptimizationOptions = {}) {
  const {
    projectDistPath = "./dist/build/mp-weixin",
    originDirName = "node-modules",
    targetDirTag = "pages",
    vendorPathPattern = defaultVendorPathPattern,
    nodeModulesPathPattern = defaultNodeModulesPathPattern,
    onlyOptimizeMainPackage = false,
  } = options;
  const cwdPath = process.cwd();
  const projectPath = isAbsolute(projectDistPath) ? projectDistPath : join(cwdPath, projectDistPath);

  // 查找 node-modules 目录的位置
  let nodeModulesDirPath = join(projectPath, originDirName);

  // 如果根目录下没有 node-modules，尝试在 pages 目录下查找
  if (!existsSync(nodeModulesDirPath)) {
    const pagesNodeModulesPath = join(projectPath, targetDirTag, originDirName);
    if (existsSync(pagesNodeModulesPath)) {
      nodeModulesDirPath = pagesNodeModulesPath;
    } else {
      console.error(chalk.redBright("node-modules does not exist in the current directory"));
      process.exit(1);
    }
  }

  // 获取所有分包的目录名称
  const packageDirNames: string[] = await getNeedPackageDirNames(join(cwdPath, projectDistPath), targetDirTag);

  modifyPackageFiles();

  // 调整分包中的文件对 node-modules 的引用 path 层级
  function modifyPackageFiles() {
    for (const packageDirName of packageDirNames) {
      replacePackageFiles(`${projectDistPath}/${packageDirName}`, nodeModulesPathPattern);
    }
  }

  modifyNodeModulesFiles();

  // 调整 node-modules 目录文件对 vendor.js 的引用 path 层级
  function modifyNodeModulesFiles() {
    // 使用动态路径而不是固定路径
    const relativeNodeModulesPath = nodeModulesDirPath.replace(join(cwdPath, projectDistPath), "").replace(/^[\\/]/, "");
    const files = globbySync(`${projectDistPath}/${relativeNodeModulesPath}/**/*.js`);

    for (const filePath of files) {
      const fullPath = join(cwdPath, filePath);
      let content = readFileSync(fullPath, "utf8");
      let match;
      let isMatched = false;

      while ((match = vendorPathPattern.exec(content)) !== null) {
        isMatched = true;
        const assetPath = match[0];
        // 原始根目录中的 node-modules 的 js 文件对 vendor.js 的相对路径引用需要增加一个 ../
        content = content.replace(assetPath, `../${assetPath}`);
      }

      if (isMatched) {
        try {
          writeFileSync(fullPath, content);
        } catch (err) {
          console.error(chalk.redBright("Failed to write node-modules file: ", err));
        }
      }
    }
  }

  copyNodeModulesToPackage(packageDirNames, nodeModulesDirPath);

  // 拷贝根目录的所有 node-modules 到 所有的分包中
  function copyNodeModulesToPackage(dirNames: string[], nodeModulesDirPath: string) {
    const currentDirPath = join(cwdPath, projectDistPath);

    dirNames.forEach((dirName) => {
      const targetPath = join(currentDirPath, dirName, originDirName);

      // 如果源路径和目标路径相同，跳过复制
      if (nodeModulesDirPath === targetPath) {
        console.log(chalk.blue(`Skipping copy for ${dirName} - source and target are the same`));
        return;
      }

      try {
        copySync(nodeModulesDirPath, targetPath);
      } catch (err) {
        console.error(chalk.redBright(`Error copy node-module to package directory ${dirName}: `, err));
      }
    });
  }

  console.log(chalk.blue(`Starting deletePackageNodeModulesPageDirs for packages: ${packageDirNames.join(", ")}`));
  await deletePackageNodeModulesPageDirs();

  // 删除所有分包的 node-modules 中多余的 pages 和 components 目录
  async function deletePackageNodeModulesPageDirs() {
    const deletePromises = packageDirNames.map((packageDirName) => {
      return deletePackageNodeModulesPageDir({
        dirName: join(cwdPath, projectDistPath, packageDirName),
        originDirName,
        targetDirTag,
        onlyOptimizeMainPackage,
      });
    });

    await Promise.all(deletePromises);
  }

  await deleteOriginNodeModules(nodeModulesDirPath);

  console.log(chalk.greenBright("Success optimize miniprogram subpackage"));
}
