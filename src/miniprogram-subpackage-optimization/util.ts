import chalk from "chalk";
import { remove } from "fs-extra/esm";
import globby, { sync as globbySync } from "globby";
import { existsSync, readFileSync, readdir, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

export async function getNeedPackageDirNames(dirName: string, targetDirTag: string) {
  return new Promise<string[]>((resolve) => {
    readdir(dirName, (err, files) => {
      if (err) {
        console.error(chalk.redBright("Error read package directory: ", err));
        return;
      }

      // 筛选出以 pages 开头的文件夹
      const targetDirNames = files.filter((file) => {
        const fullPath = join(dirName, file);

        return statSync(fullPath).isDirectory() && file.startsWith(targetDirTag);
      });

      resolve(targetDirNames);
    });
  });
}

export function replacePackageFiles(dirName: string, nodeModulesPattern: RegExp) {
  const files = globbySync(`${dirName}/**/*.{js,json}`);

  for (const filePath of files) {
    const fullPath = join(process.cwd(), filePath);
    let content = readFileSync(fullPath, "utf8");
    let match;
    let isMatched = false;

    while ((match = nodeModulesPattern.exec(content)) !== null) {
      isMatched = true;
      const assetPath = match[0];
      // 分包中的文件对 node-modules 的相对路径引用需要去掉一个 ../
      content = content.replace(assetPath, assetPath.slice(3));
    }

    if (isMatched) {
      try {
        writeFileSync(fullPath, content);
      } catch (err) {
        console.error(chalk.redBright("Failed to write package file: ", err));
      }
    }
  }
}

export async function deletePackageNodeModulesPageDir(props: {
  dirName: string;
  originDirName: string;
  targetDirTag: string;
  onlyOptimizeMainPackage: boolean;
}): Promise<void> {
  const { dirName, originDirName, targetDirTag, onlyOptimizeMainPackage } = props;
  let needPackagePagesNames = await getChildrenDirNamesByFilePath(dirName);
  const needCommonComponentDirNames: string[] = [];

  // 兼容 Windows 路径分隔符
  const globbyDirName = dirName.split("\\").join("/");
  // 匹配分包中的 node-modules 里面的 pages 路径
  const packageNodeModulesPagesPaths = await globby(`${globbyDirName}/**/${targetDirTag}`, {
    onlyDirectories: true, // 只匹配目录
  });
  const packageNodeModulesPagesPath = packageNodeModulesPagesPaths?.[0];

  if (!packageNodeModulesPagesPath) {
    return;
  }

  const packageNodeModulesPagesDirNames = await getChildrenDirNamesByFilePath(packageNodeModulesPagesPath);
  const needPageDirNames = packageNodeModulesPagesDirNames.filter((dirName) => {
    return needPackagePagesNames.includes(basename(dirName));
  });

  // 匹配分包中 node-modules 里面的 components 路径
  const packageNodeModulesComponentsPaths = await globby(`${globbyDirName}/**/components`, {
    onlyDirectories: true, // 只匹配目录
  });
  const packageNodeModulesComponentsPath = packageNodeModulesComponentsPaths?.[0];

  const getPagesComponentsDependentComponent = (componentPath: string) => {
    try {
      const content = readFileSync(componentPath, "utf8");

      const usingComponents = (JSON.parse(content) as Record<string, Record<string, string>>).usingComponents;

      Object.keys(usingComponents!).forEach((key) => {
        const path = formatPath(usingComponents![key]!);
        const commonComponentDirName = path.split("/")[0];

        if (path.startsWith(originDirName)) {
          return;
        }

        if (!needCommonComponentDirNames.includes(commonComponentDirName!)) {
          needCommonComponentDirNames.push(commonComponentDirName!);

          getDependentComponent(commonComponentDirName!);
        }
      });
    } catch (err) {
      console.error(chalk.redBright("Failed to read package node-modules pages components components file: ", err));
    }
  };

  const getDependentComponent = (componentDirName: string) => {
    try {
      const content = readFileSync(join(packageNodeModulesComponentsPath!, componentDirName, "index.json"), "utf8");
      const usingComponents = (JSON.parse(content) as Record<string, Record<string, string>>).usingComponents;

      Object.keys(usingComponents!).forEach((key) => {
        const path = formatPath(usingComponents![key]!);

        if (path.startsWith(originDirName)) {
          return;
        }

        if (path.startsWith("components")) {
          if (usingComponents![key]!.startsWith("./")) {
            getPagesComponentsDependentComponent(join(packageNodeModulesComponentsPath!, componentDirName, `${path}.json`));
          }

          return;
        }

        const commonComponentDirName = path.split("/")[0];

        if (!needCommonComponentDirNames.includes(commonComponentDirName!)) {
          needCommonComponentDirNames.push(commonComponentDirName!);

          getDependentComponent(commonComponentDirName!);
        }
      });
    } catch (err) {
      console.error(
        chalk.redBright(
          `Error read package node-modules components<${componentDirName}> directory ${packageNodeModulesPagesPath}: `,
          err
        )
      );
    }
  };

  // 收集分包中的 node-modules pages 的公共依赖
  if (needPageDirNames.length > 0) {
    const needCommonPageDirNames: string[] = [];

    needPageDirNames.forEach((pageDirName) => {
      try {
        const content = readFileSync(join(packageNodeModulesPagesPath, pageDirName, "index.json"), "utf8");
        const usingComponents = (JSON.parse(content) as Record<string, Record<string, string>>).usingComponents;

        Object.keys(usingComponents!).forEach((key) => {
          const path = formatPath(usingComponents![key]!);

          if (path.startsWith(originDirName)) {
            return;
          }

          if (path.startsWith("components")) {
            if (usingComponents![key]!.startsWith("../")) {
              const commonComponentDirName = path.split("/")[1];

              if (!needCommonComponentDirNames.includes(commonComponentDirName!)) {
                needCommonComponentDirNames.push(commonComponentDirName!);

                getDependentComponent(commonComponentDirName!);
              }
            }

            return;
          }

          const commonPageDirName = path.split("/")[0];

          if (!needCommonPageDirNames.includes(commonPageDirName!)) {
            needCommonPageDirNames.push(commonPageDirName!);
          }
        });

        const componentsDirPath = join(packageNodeModulesPagesPath, pageDirName, "components");

        if (existsSync(componentsDirPath)) {
          const componentsDirNames = getChildrenDirNamesByFilePathSync(componentsDirPath);

          componentsDirNames.forEach((componentDirName) => {
            try {
              const content = readFileSync(
                join(packageNodeModulesPagesPath, pageDirName, "components", componentDirName, "index.json"),
                "utf8"
              );

              const usingComponents = (JSON.parse(content) as Record<string, Record<string, string>>).usingComponents;

              Object.keys(usingComponents!).forEach((key) => {
                const path = formatPath(usingComponents![key]!);

                if (path.startsWith("components")) {
                  const commonComponentDirName = path.split("/")[1];

                  if (usingComponents![key]!.startsWith("./")) {
                    getPagesComponentsDependentComponent(
                      join(packageNodeModulesPagesPath, pageDirName, "components", componentDirName, `${path}.json`)
                    );
                  } else if (!needCommonComponentDirNames.includes(commonComponentDirName!)) {
                    needCommonComponentDirNames.push(commonComponentDirName!);

                    getDependentComponent(commonComponentDirName!);
                  }
                }
              });
            } catch (err) {
              console.error(chalk.redBright("Failed to read package node-modules pages components file: ", err));
            }
          });
        }
      } catch (err) {
        console.error(chalk.redBright("Failed to read package node-modules pages file: ", err));
      }
    });

    if (needCommonPageDirNames.length > 0) {
      needPackagePagesNames = needPackagePagesNames.concat(needCommonPageDirNames);
    }
  }

  // 删除分包的 node-modules 里面的多余 pages
  await new Promise<void>((resolve, reject) => {
    readdir(packageNodeModulesPagesPath, (err, files) => {
      if (err) {
        console.error(
          chalk.redBright(`Error read package node-modules pages directory ${packageNodeModulesPagesPath}: `, err?.message)
        );
        reject(err);
        return;
      }

      const dirNames = files.filter((file) => {
        const fullPath = join(packageNodeModulesPagesPath, file);

        return statSync(fullPath).isDirectory();
      });

      const deletePromises: Promise<void>[] = [];

      for (const dirName of dirNames) {
        if (!needPackagePagesNames.includes(dirName)) {
          const deletePromise = new Promise<void>((resolveDelete, rejectDelete) => {
            remove(join(packageNodeModulesPagesPath, dirName), (err) => {
              if (err) {
                console.error(chalk.redBright(`Error remove package node-modules pages directory: ${err?.message}`));
                rejectDelete(err);
              } else {
                resolveDelete();
              }
            });
          });
          deletePromises.push(deletePromise);
        }
      }

      Promise.all(deletePromises)
        .then(() => resolve())
        .catch(reject);
    });
  });

  // 删除分包的 node-modules 里面的多余 components
  if (packageNodeModulesComponentsPath && needCommonComponentDirNames.length > 0) {
    // 仅仅优化主包 components，子包的 node-modules components 不删除
    if (onlyOptimizeMainPackage && basename(dirName) !== targetDirTag) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      readdir(packageNodeModulesComponentsPath, (err, files) => {
        if (err) {
          console.error(
            chalk.redBright(`Error read package node-modules components directory ${packageNodeModulesPagesPath}: `, err?.message)
          );
          reject(err);
          return;
        }

        const dirNames = files.filter((file) => {
          const fullPath = join(packageNodeModulesComponentsPath, file);

          return statSync(fullPath).isDirectory();
        });

        const deletePromises: Promise<void>[] = [];

        for (const dirName of dirNames) {
          if (!needCommonComponentDirNames.includes(dirName)) {
            const deletePromise = new Promise<void>((resolveDelete, rejectDelete) => {
              remove(join(packageNodeModulesComponentsPath, dirName), (err) => {
                if (err) {
                  console.error(
                    chalk.redBright(`Error remove package node-modules components<${dirName}>  directory: ${err?.message}`)
                  );
                  rejectDelete(err);
                } else {
                  resolveDelete();
                }
              });
            });
            deletePromises.push(deletePromise);
          }
        }

        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject);
      });
    });
  }
}

// 异步获取目录下的所有文件夹名称
async function getChildrenDirNamesByFilePath(dirName: string) {
  return new Promise<string[]>((resolve) => {
    readdir(dirName, (err, files) => {
      if (err) {
        console.error(chalk.redBright(`Error read package pages directory ${dirName}:`, err));

        return;
      }

      const dirNames = files.filter((file) => {
        const fullPath = join(dirName, file);

        return statSync(fullPath).isDirectory();
      });

      resolve(dirNames);
    });
  });
}

// 同步获取目录下的所有文件夹名称
function getChildrenDirNamesByFilePathSync(dirPath: string) {
  const items = readdirSync(dirPath);
  const dirs: string[] = [];

  items.forEach((item) => {
    const fullPath = join(dirPath, item);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      dirs.push(item);
    }
  });

  return dirs;
}

// 格式化路径，去掉路径前面的所有 ./ 或者 ../
function formatPath(pathName: string) {
  while (pathName.startsWith("../")) {
    pathName = pathName.slice(3);
  }

  while (pathName.startsWith("./")) {
    pathName = pathName.slice(2);
  }

  return pathName;
}

// 删除根目录的 node-modules 目录
export function deleteOriginNodeModules(dirName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    remove(dirName, (err) => {
      if (err) {
        console.error(chalk.redBright(`Error delete node-modules: ${err?.message}`));
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
