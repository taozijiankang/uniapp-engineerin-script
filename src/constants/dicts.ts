import { AppType, EnvName } from "../types/config.js";
import { AppStartMode, MPVersionType, ProjectStartType, ConfirmType, UpdateVersionType, OpenWxToolType } from "./enum.js";

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

export const MPVersionTypeDicts = [
  {
    value: MPVersionType.TRIAL,
    label: "🔍 体验版本",
  },
  {
    value: MPVersionType.RELEASE,
    label: "🎯 正式版本",
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

export const UpdateVersionTypeDicts = [
  {
    value: UpdateVersionType.NONE,
    label: "不更新",
  },
  {
    value: UpdateVersionType.PATCH,
    label: "修订版本",
  },
  {
    value: UpdateVersionType.MINOR,
    label: "次版本",
  },
  {
    value: UpdateVersionType.MAJOR,
    label: "主版本",
  },
];

export const AppEnvModeDescriptionDicts: { value: EnvName; label: string }[] = [
  {
    value: "development",
    label: "🔧 开发环境",
  },
  {
    value: "test",
    label: "🐞 测试环境",
  },
  {
    value: "production",
    label: "🚀 生产环境",
  },
];

export const AppTypeDescriptionDicts: { value: AppType; label: string }[] = [
  {
    value: "cloud-outpatient",
    label: "云门诊",
  },
  {
    value: "internet-hospital",
    label: "互联网医院",
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
