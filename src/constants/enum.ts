export enum ProjectStartType {
  /** 普通类型 */
  COMMON = "common",
  /** 发布类型 */
  RELEASE = "release",
}

export enum AppStartMode {
  /** 开发模式 */
  DEV = "dev",
  /** 构建模式 */
  BUILD = "build",
}

export enum AppVersionType {
  /** 体验版本 */
  TRIAL = "trial",
  /** 正式版本 */
  RELEASE = "release",
}

export enum ConfirmType {
  /** 是 */
  YES = "yes",
  /** 否 */
  NO = "no",
}

export enum UpdateVersionNumType {
  /** 不更新 */
  NONE = "none",
  /** 主版本 */
  MAJOR = "major",
  /** 次版本 */
  MINOR = "minor",
  /** 修订版本 */
  PATCH = "patch",
}

export enum OpenWxToolType {
  /** 开发目录 */
  DEV = "dev",
  /** 构建目录 */
  BUILD = "build",
}
