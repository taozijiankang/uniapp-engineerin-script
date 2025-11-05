import path from "path";
import fs from "fs";

import { AppVersionType, AppVersionTypeDicts } from "../constants/index.js";
import { getGitInfo } from "./getGitInfo.js";
import { AppConfigExtend } from "../types/config.js";
import { UpdateVersionNumType } from "../constants/enum.js";
import type { CIProject } from "miniprogram-ci";
import { getRootDir } from "../pathManage.js";
import semver from "semver";

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

  const { default: miniprogramCi } = await import("miniprogram-ci");

  const project = new miniprogramCi.Project({
    appid,
    type: "miniProgram",
    projectPath: weixinMPBuildPath,
    privateKey,
  });

  const robotNumber = Number(
    `${appVersionType === AppVersionType.RELEASE ? 1 : 2}${appConfig.envs?.find((item) => item.name === env)?.ciRobot || 0}`
  );

  console.log(`获取小程序 ${appConfig.description || appConfig.name} 机器人 ${robotNumber} 最新版本...`);
  const latestVersion = await getAppLatestVersion(project, robotNumber)
    .then((version) => {
      console.log(`小程序 ${appConfig.description || appConfig.name} 机器人 ${robotNumber} 最新版本为: ${version}`);
      return version;
    })
    .catch((error) => {
      console.error(`获取小程序 ${appConfig.description || appConfig.name} 最新版本失败，机器人: ${robotNumber}，错误:`, error);
      const version = JSON.parse(fs.readFileSync(path.join(appConfig.path, "package.json"), "utf8")).version;
      console.log(`使用 package.json 中的版本号: ${version}`);
      return version;
    });

  const releaseType =
    updateVersionNumType === UpdateVersionNumType.MAJOR
      ? "major"
      : updateVersionNumType === UpdateVersionNumType.MINOR
      ? "minor"
      : updateVersionNumType === UpdateVersionNumType.PATCH
      ? "patch"
      : undefined;

  const newVersion = releaseType ? semver.inc(latestVersion, releaseType) : latestVersion;

  const desc = [
    {
      label: "应用名称",
      value: appConfig.description || appConfig.name,
    },
    {
      label: "版本类型",
      value: AppVersionTypeDicts.find((item) => item.value === appVersionType)?.label || appVersionType,
    },
    {
      label: "环境",
      value: appConfig.envs?.find((item) => item.name === env)?.description || env,
    },
    {
      label: "提交信息",
      value: await getGitInfo({
        cwd: appConfig.path,
      }),
    },
  ]
    .map((item) => `[${item.label}: ${item.value}]`)
    .join(" ");

  const upload = async () => {
    const uploadResult = await miniprogramCi.upload({
      project,
      version: newVersion,
      desc,
      robot: robotNumber,
      onProgressUpdate: () => {
        //
      },
    });
    console.log(uploadResult);
    console.log(`${desc} 版本号: ${newVersion} 上传成功`);
  };
  // 重试3次
  let p = Promise.resolve(upload());
  for (let i = 0; i < 3; i++) {
    p = p.catch(() => upload());
  }
  await p;
}

async function getAppLatestVersion(project: CIProject, robotNumber: number) {
  const { default: miniprogramCi } = await import("miniprogram-ci");
  const { default: unzipper } = await import("unzipper");

  const appid = project.appid;

  const sourceMapSavePath = `${getRootDir()}/node_modules/.app-sm-cache/app-${appid}-robot-${robotNumber}-sm.zip`;

  if (!fs.statSync(path.dirname(sourceMapSavePath), { throwIfNoEntry: false })?.isDirectory()) {
    fs.mkdirSync(path.dirname(sourceMapSavePath), { recursive: true });
  }

  await miniprogramCi.getDevSourceMap({
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
}
