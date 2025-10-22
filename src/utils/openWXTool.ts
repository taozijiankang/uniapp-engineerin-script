import fs from "fs";
import { globSync } from "glob";
import http from "http";
import path from "path";

import { isWindows } from "./is.js";

/**
 * @param projectPath
 */
export async function openWXTool(projectPath: string) {
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
