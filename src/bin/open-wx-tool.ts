#!/usr/bin/env node
import { program } from "commander";
import chalk from "chalk";
import path from "path";
import fs from "fs";
import { globSync } from "glob";
import http from "http";

import { AppStartModeDicts } from "../constants/dicts.js";
import { packageJson } from "../packageJson.js";
import { getConfig } from "../config/index.js";
import { getApps } from "../appManage/getApps.js";
import { isWindows } from "../utils/is.js";

program.version(packageJson.version).description("在微信开发者工具中打开项目");

export interface OpenWxToolOptions {
  packageName?: string;
  mode?: string;
}

program
  .description("在微信开发者工具中打开项目")
  .option("-n, --packageName <packageName>", "项目包名")
  .option("-m, --mode <mode>", `模式 可选值：${AppStartModeDicts.map((item) => item.value).join("|")}`)
  .action(async (options: OpenWxToolOptions) => {
    const { packageName, mode } = options;
    if (!packageName) {
      console.error(chalk.red("请指定项目包名"));
      return;
    }
    const config = await getConfig();
    const appsConfig = getApps(config);
    const appConfig = appsConfig.find((item) => item.packageName === packageName);
    if (!appConfig) {
      console.error(chalk.red(`未找到项目: ${packageName}`));
      return;
    }
    if (!mode) {
      console.error(chalk.red(`请指定模式(${AppStartModeDicts.map((item) => item.value).join("|")})`));
      return;
    } else {
      if (!AppStartModeDicts.find((item) => item.value === mode)) {
        console.error(chalk.red(`无效的模式: ${mode}`));
        return;
      }
    }
    await openWXTool(path.join(appConfig.path, "dist", mode, "mp-weixin"));
  });

program.parse(process.argv);

async function openWXTool(projectPath: string) {
  const homeDir = isWindows() ? process.env.USERPROFILE : process.env.HOME;
  if (!homeDir) {
    throw new Error("无法获取用户主目录路径，请检查环境变量");
  }
  const idea = globSync(
    path
      .join(
        homeDir,
        isWindows()
          ? "AppData/Local/微信开发者工具/User Data/*/Default/.ide"
          : "/Library/Application Support/微信开发者工具/*/Default/.ide"
      )
      .replaceAll(path.sep, "/")
  );
  if (idea.length === 0) {
    throw new Error("未找到微信开发者工具配置文件 .ide");
  }
  const ideaStr = fs.readFileSync(idea[0] || "", "utf-8").trim();
  if (!ideaStr) {
    throw new Error("微信开发者工具配置文件 .ide 内容为空");
  }
  return new Promise<string>((resolve, reject) => {
    const req = http.request(`http://127.0.0.1:${ideaStr}/v2/open?project=${projectPath}`, {
      method: "GET",
    });
    setTimeout(() => {
      reject(new Error("请求超时"));
    }, 3000);
    req.on("response", (res) => {
      const data: any[] = [];
      res.on("data", (chunk) => {
        data.push(chunk);
      });
      res.on("end", () => {
        resolve(Buffer.concat(data).toString("utf-8"));
      });
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.end();
  })
    .then((res) => {
      return JSON.parse(res);
    })
    .then((res) => {
      if (typeof res === "object" && res.message) {
        throw res.message;
      }
      return res;
    });
}
