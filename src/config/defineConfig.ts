import { ProjectConfig } from "../types/config.js";

/**
 * 定义项目配置
 * @param config
 */
export function defineConfig(config: ProjectConfig | (() => Promise<ProjectConfig> | ProjectConfig)) {
  return config;
}
