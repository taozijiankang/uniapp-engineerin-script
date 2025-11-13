import { AppConfig, AppConfigExtend } from "../../types/config.js";
import { LoaderHandler } from "./type.js";

/**
 * 代码注入
 * 示例：
 * // TODO: #code_inject
 * // 代码注入内容 __APP_CONFIG__ 为 appConfig 的 JSON 字符串
 * // TODO: #end_code_inject
 */
export const codeInject: LoaderHandler = (_: string, appConfig: AppConfigExtend, buffer: Buffer) => {
  const appBaseConfig: AppConfig = {
    name: appConfig.name,
    type: appConfig.type,
    description: appConfig.description,
    comEnv: appConfig.comEnv,
    envs: appConfig.envs,
  };
  return buffer
    .toString()
    .replace(/\/\/\s*TODO:\s*#code_inject\s*([\s\S]*?)\s*\/\/\sTODO:\s*#end_code_inject[ ]*/g, (_, code) => {
      return code.replace(/^\/\/\s*/m, "").replace(/__APP_CONFIG__/g, JSON.stringify(appBaseConfig));
    });
};
