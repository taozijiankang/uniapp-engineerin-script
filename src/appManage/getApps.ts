import fs from "fs";
import path from "path";

import { AppConfigExtend, ProjectConfigExtend } from "../types/config.js";

export function getApps(config: ProjectConfigExtend) {
  /** @type {ProjectPackageJson} */
  const projectPackage = JSON.parse(fs.readFileSync(path.join(config.dirs.rootDir, "./package.json")).toString());
  return config.apps.map((item, index) => {
    const res: AppConfigExtend = {
      ...item,
      index,
      packageName: `@${projectPackage.name}-${item.type}-app/${item.name}`,
      path: path.join(config.dirs.appsDir, item.type, item.name),
    };
    return res;
  });
}
