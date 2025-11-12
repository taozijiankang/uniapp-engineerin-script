import { lookupFile } from "../utils/global.js";
import { ProjectConfigFileName } from "../constants/index.js";
import path from "path";
import { generateProjectDirsConfig } from "./generateProjectDirsConfig.js";
import { pathToFileURL } from "url";
import { ProjectConfigExtend } from "../types/config.js";
import { defineConfig } from "./defineConfig.js";

let getConfigCache: Promise<ProjectConfigExtend> | null = null;

export async function getConfig() {
  if (!getConfigCache) {
    getConfigCache = new Promise(async (resolve) => {
      const projectConfigPath = lookupFile(process.cwd(), [ProjectConfigFileName]);
      if (!projectConfigPath) {
        throw new Error(`在当前目录 ${process.cwd()} 和上层目录 下找不到 ${ProjectConfigFileName} 文件`);
      }
      const projectRootDir = path.dirname(projectConfigPath);

      console.log(`项目根目录: ${projectRootDir} @ ${projectConfigPath}`);

      let projectConfig: Parameters<typeof defineConfig>[0] = await import(pathToFileURL(projectConfigPath).toString()).then(
        (res) => res.default
      );

      if (typeof projectConfig === "function") {
        projectConfig = await Promise.resolve(projectConfig());
      }
      const dirs = generateProjectDirsConfig(projectRootDir);
      resolve({
        ...projectConfig,
        dirs,
        appSyncHandleNumber: projectConfig.appSyncHandleNumber || 3,
      });
    });
  }
  return getConfigCache;
}
