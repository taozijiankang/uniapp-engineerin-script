import { AppStartMode, ProjectStartType, ConfirmType, UpdateVersionNumType, OpenWxToolType } from "./enum.js";

export const ProjectStartTypeDicts = [
  {
    value: ProjectStartType.COMMON,
    label: "普通 正常开发",
  },
  {
    value: ProjectStartType.RELEASE,
    label: "发布 批量发布",
  },
];

export const AppStartModeDicts = [
  {
    value: AppStartMode.DEV,
    label: "🛠️ 开发模式",
  },
  {
    value: AppStartMode.BUILD,
    label: "📦 构建模式",
  },
];

export const ConfirmTypeDicts = [
  {
    value: ConfirmType.YES,
    label: "是",
  },
  {
    value: ConfirmType.NO,
    label: "否",
  },
];

export const UpdateVersionNumTypeDicts = [
  {
    value: UpdateVersionNumType.NONE,
    label: "不更新版本",
  },
  {
    value: UpdateVersionNumType.PATCH,
    label: "修订版本",
  },
  {
    value: UpdateVersionNumType.MINOR,
    label: "次版本",
  },
  {
    value: UpdateVersionNumType.MAJOR,
    label: "主版本",
  },
];

export const OpenWxToolTypeDicts = [
  {
    value: OpenWxToolType.DEV,
    label: "开发目录",
  },
  {
    value: OpenWxToolType.BUILD,
    label: "构建目录",
  },
];
