import fs from "fs";
import path from "path";

import { AppConfigExtend, ProjectConfigExtend } from "../types/config.js";
import { Colors } from "../constants/color.js";
import { PackageJson } from "../types/index.js";

export function getApps(config: ProjectConfigExtend) {
  const projectPackage: PackageJson = JSON.parse(fs.readFileSync(path.join(config.dirs.rootDir, "./package.json")).toString());
  const apps = config.apps.map((item, index) => {
    const dirName = (item.dirName || "").replace(/\\/g, "/").replace(/^\/|\/$/g, "");
    const packageSecondaryName = `${dirName ? `${dirName}-` : ""}${item.name}`.replace(/\\/g, "/").replace(/\//g, "-");
    const res: AppConfigExtend = {
      ...item,
      index,
      packageName: `@${projectPackage.name}-app/${packageSecondaryName}`.toLowerCase(),
      path: path.join(config.appsDir, dirName, item.name),
      signColor: Colors[index] || "#f9ed69",
    };
    return res;
  });
  // 检测 apps 中是否存在重复的 packageName
  for (const packageName of apps.map((item) => item.packageName)) {
    const packageNameCount = apps.filter((item) => item.packageName === packageName).length;
    if (packageNameCount > 1) {
      throw new Error(`apps 中存在重复的 packageName，请检查 app 配置是否存在重复的 dirName/name: ${packageName}`);
    }
  }
  return apps;
}
