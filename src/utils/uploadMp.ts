import path from "path";
import fs from "fs";

import { AppVersionType, AppVersionTypeDicts } from "../constants/index.js";
import { getGitInfo } from "./getGitInfo.js";
import { AppConfigExtend } from "../types/config.js";
import { UpdateVersionNumType } from "../constants/enum.js";
import { getUpdateVersionNum } from "./getUpdateVersionNum.js";
import type { CIProject } from "miniprogram-ci";
import { getRootDir } from "../pathManage.js";
import unzipper from "unzipper";

export async function uploadMp(options: {
  appConfig: AppConfigExtend;
  appVersionType: AppVersionType;
  env: string;
  updateVersionNumType: UpdateVersionNumType;
  appid: string;
  privateKey: string;
}) {
  const { appConfig, appVersionType, env, updateVersionNumType, appid, privateKey } = options;

  const weixinMPBuildPath = path.join(appConfig.path, "dist/build/mp-weixin");

  const ci = (await import("miniprogram-ci")).default;

  const project = new ci.Project({
    appid,
    type: "miniProgram",
    projectPath: weixinMPBuildPath,
    privateKey,
  });

  const desc = `[${appConfig.description || appConfig.name}] 版本类型: [${
    AppVersionTypeDicts.find((item) => item.value === appVersionType)?.label || appVersionType
  }] 环境: [${appConfig.envs?.find((item) => item.name === env)?.description || env}] 提交信息: [${(
    await getGitInfo({
      cwd: appConfig.path,
    })
  ).trim()}]`;

  const robotNumber = Number(
    `${appVersionType === AppVersionType.RELEASE ? 1 : 2}${appConfig.envs?.find((item) => item.name === env)?.ciRobot || 0}`
  );

  console.log(`获取小程序 ${appid} 机器人 ${robotNumber} 最新版本...`);
  const latestVersion = await getAppLatestVersion(project, robotNumber);
  console.log(`小程序 ${appid} 机器人 ${robotNumber} 最新版本为: ${latestVersion}`);

  const upload = async () => {
    const uploadResult = await ci.upload({
      project,
      version: getUpdateVersionNum(latestVersion, updateVersionNumType),
      desc,
      robot: robotNumber,
      onProgressUpdate: () => {
        //
      },
    });
    console.log(uploadResult);
    console.log(`${desc} 上传成功`);
  };
  // 重试3次
  let p = Promise.resolve(upload());
  for (let i = 0; i < 3; i++) {
    p = p.catch(() => upload());
  }
  await p;
}

async function getAppLatestVersion(project: CIProject, robotNumber: number) {
  const ci = (await import("miniprogram-ci")).default;

  const appid = project.appid;

  const sourceMapSavePath = `${getRootDir()}/node_modules/.app-sm-cache/app-${appid}-robot-${robotNumber}-sm.zip`;

  if (!fs.statSync(path.dirname(sourceMapSavePath), { throwIfNoEntry: false })?.isDirectory()) {
    fs.mkdirSync(path.dirname(sourceMapSavePath), { recursive: true });
  }

  try {
    await ci.getDevSourceMap({
      project,
      robot: robotNumber,
      sourceMapSavePath,
    });

    const directory = await unzipper.Open.file(sourceMapSavePath);
    const appServiceMapFile = directory.files.find((item) =>
      /^\/(__APP__|__FULL__)\/(app-service\.js\.map|appservice\.app\.js\.map)$/.test(item.path)
    );
    if (!appServiceMapFile) {
      throw new Error(
        `获取小程序${appid}最新版本失败，机器人: ${robotNumber}，错误: (__APP__|__FULL__)/(app-service.js.map|appservice.app.js.map) 文件不存在`
      );
    }
    const appServiceMap: {
      wx: {
        version: string | number;
        userVersion: string;
        userNotes: string;
      };
    } = JSON.parse((await appServiceMapFile.buffer()).toString());

    return appServiceMap.wx.userVersion;
  } catch (error) {
    console.error(`获取小程序${appid}最新版本失败，机器人: ${robotNumber}，错误:`, error);
  }
  return "1.0.0";
}
