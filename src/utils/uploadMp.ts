import path from "path";

import { MPVersionType, MPVersionTypeDicts } from "../constants/index.js";
import { getGitInfo } from "./getGitInfo.js";
import { AppConfigExtend, MPVersionTypeValue } from "../types/config.js";

/**
 * @param appConfig
 * @param versionType
 * @param env
 * @param version
 * @param privateKey
 */
export async function uploadMp(
  appConfig: AppConfigExtend,
  versionType: MPVersionTypeValue,
  env: string,
  version: string,
  appid: string,
  privateKey: string
) {
  const weixinMPBuildPath = path.join(appConfig.path, "dist/build/mp-weixin");

  const ci = (await import("miniprogram-ci")).default;

  const project = new ci.Project({
    appid,
    type: "miniProgram",
    projectPath: weixinMPBuildPath,
    privateKey,
  });

  const desc = `[${appConfig.description || appConfig.name}] 版本类型: [${
    MPVersionTypeDicts.find((item) => item.value === versionType)?.label || versionType
  }] 环境: [${appConfig.envs?.find((item) => item.name === env)?.description || env}] 提交信息: [${(
    await getGitInfo({
      cwd: appConfig.path,
    })
  ).trim()}]`;

  const upload = async () => {
    const uploadResult = await ci.upload({
      project,
      version,
      desc,
      robot: Number(
        `${versionType === MPVersionType.RELEASE ? 1 : 2}${appConfig.envs?.find((item) => item.name === env)?.ciRobot || 0}`
      ),
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
