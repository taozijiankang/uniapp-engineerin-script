import fs from "fs";
import path from "path";

import { AppConfigExtend, ProjectConfigExtend } from "../types/config.js";
import { Colors } from "../constants/color.js";
import { PackageJson } from "../types/index.js";

export function getApps(config: ProjectConfigExtend) {
  const projectPackage: PackageJson = JSON.parse(fs.readFileSync(path.join(config.dirs.rootDir, "./package.json")).toString());
  return config.apps.map((item, index) => {
    const res: AppConfigExtend = {
      ...item,
      index,
      key: `${item.type}-${item.name}`,
      packageName: `@${projectPackage.name}-${item.type}-app/${item.name}`,
      path: path.join(config.dirs.appsDir, item.type, item.name),
      signColor: Colors[index] || "#f9ed69",
    };
    return res;
  });
}
