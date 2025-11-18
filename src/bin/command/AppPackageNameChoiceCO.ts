import { getApps } from "../../appManage/getApps.js";
import { getConfig } from "../../config/index.js";
import { SelectCommandOption } from "./SelectCommandOption.js";
import { Command } from "commander";
import { AppConfigExtend } from "../../types/config.js";
import inquirer from "inquirer";
import fuzzy from "fuzzy";
import path from "path";
// @ts-expect-error
import autocompletePrompt from "inquirer-autocomplete-prompt";
// @ts-expect-error
import CheckboxPlus from "inquirer-checkbox-plus-prompt";

inquirer.registerPrompt("autocomplete", autocompletePrompt);
inquirer.registerPrompt("checkbox-plus", CheckboxPlus);

export class AppPackageNameChoiceCO extends SelectCommandOption {
  selectApps: AppConfigExtend[] = [];

  private appsConfig: AppConfigExtend[] = [];

  constructor(options: { selectType: "single" | "multiple" }) {
    const { selectType } = options;
    super({
      name: `appPackageName${selectType === "single" ? "" : "s"}`,
      description: "app项目package.json中的name字段",
      options: [],
      selectType,
    });
  }

  async register(command: Command): Promise<void> {
    await this.init();
    await super.register(command);
  }

  setValue(value?: string): this {
    super.setValue(value);

    if (this.selectValues.length > 0) {
      if (this.selectType === "single") {
        this.selectApps = [this.appsConfig.find((app) => this.selectValues.includes(app.packageName)) as AppConfigExtend].filter(
          Boolean
        );
      } else if (this.selectType === "multiple") {
        this.selectApps = this.appsConfig.filter((app) => this.selectValues.includes(app.packageName)) as AppConfigExtend[];
      }
    }
    return this;
  }

  async init() {
    const config = await getConfig();

    this.appsConfig = getApps(config);

    this.options = this.appsConfig.map((app) => ({
      value: app.packageName,
      name: `[${app.index.toString().padStart(this.appsConfig.length.toString().length, "0")}] ${
        app.description || app.packageName
      } ${path.relative(config.dirs.rootDir, app.path)}`,
    }));

    this.inquirerMessage = `请选择App项目,${this.selectType === "single" ? "单选" : "多选"}(${this.options.length})：`;

    return this;
  }

  async inquirer(deValue?: string | string[]) {
    const defaultValues = deValue ? (Array.isArray(deValue) ? deValue : [deValue]) : undefined;
    if (this.selectType === "single") {
      const { value } = await inquirer.prompt<{ value: string }>([
        {
          type: "autocomplete",
          name: "value",
          message: this.inquirerMessage,
          source: (_: any, input: string) => {
            input = (input || "").trim();
            return fuzzy
              .filter(input, this.options, {
                extract: (item) => item.name,
              })
              .map((item) => item.original);
          },
          default: defaultValues?.[0],
        },
      ]);
      this.setValue(value);
    } else if (this.selectType === "multiple") {
      const { values } = await inquirer.prompt<{ values: string[] }>([
        {
          type: "checkbox-plus",
          name: "values",
          message: this.inquirerMessage,
          highlight: true,
          searchable: true,
          pageSize: 20,
          default: defaultValues,
          source: async (_: any, input: string) => {
            input = (input || "").trim();
            return fuzzy
              .filter(input, this.options, {
                extract: (item) => item.name,
              })
              .map((item) => item.original);
          },
        },
      ]);
      this.setValue(values.join(","));
    }
  }
}
