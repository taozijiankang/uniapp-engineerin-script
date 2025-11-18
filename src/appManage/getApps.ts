import fs from "fs";
import path from "path";

import { AppConfigExtend, ProjectConfigExtend } from "../types/config.js";
import { Colors } from "../constants/color.js";
import { PackageJson } from "../types/index.js";

export function getApps(config: ProjectConfigExtend) {
  const projectPackage: PackageJson = JSON.parse(fs.readFileSync(path.join(config.dirs.rootDir, "./package.json")).toString());
  return config.apps.map((item, index) => {
    const key = `${item.dirName}/${item.name}`.replace(/\\/g, "/");
    const res: AppConfigExtend = {
      ...item,
      index,
      key,
      packageName: `@${projectPackage.name}-app/${key.replace(/\//g, "-")}`.toLowerCase(),
      path: path.join(config.appsDir, item.dirName, item.name),
      signColor: Colors[index] || "#f9ed69",
    };
    return res;
  });
}
