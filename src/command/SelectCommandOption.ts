import inquirer from "inquirer";
import { BaseCommandOption } from "./BaseCommandOption.js";
import { Command } from "commander";

export class SelectCommandOption extends BaseCommandOption {
  declare value?: string;

  selectValues: string[] = [];

  options: {
    name: string;
    value: string;
  }[];
  selectType: "single" | "multiple" = "single";
  defValue?: string[];

  inquirerMessage: string = "请选择选项：";

  constructor(options: {
    name: string;
    description: string;
    options: { name: string; value: string }[];
    selectType: "single" | "multiple";
    defValue?: string[];
  }) {
    super(options);
    this.options = options.options;
    this.selectType = options.selectType;
    this.defValue = options.defValue;
  }

  register(command: Command): void {
    command.option(
      `--${this.name} <${this.name}>`,
      `${this.description}，${this.selectType === "single" ? "单选" : "多选，多个选项用逗号分隔"}，可选值：${this.options
        .map((option) => option.value)
        .join(",")}`,
      this.defValue?.join(",")
    );
  }

  setValue(value?: string): this {
    this.value = value;

    this.selectValues = (value?.split(",") || []).map((item) => item.trim()).filter(Boolean);
    this.selectValues = this.selectValues.filter((item) => this.options.some((option) => option.value === item));
    if (this.selectType === "single") {
      this.selectValues = this.selectValues.length ? [this.selectValues[0]!] : [];
    }
    return this;
  }

  async inquirer(deValue?: string[] | string) {
    const defaultValues = deValue ? (Array.isArray(deValue) ? deValue : [deValue]) : undefined;
    if (this.selectType === "single") {
      const { value } = await inquirer.prompt<{ value: string }>([
        {
          type: "list",
          name: "value",
          message: this.inquirerMessage,
          choices: this.options.map((option) => ({
            value: option.value,
            name: option.name,
          })),
          default: defaultValues?.[0],
        },
      ]);
      this.setValue(value);
    } else if (this.selectType === "multiple") {
      const { values } = await inquirer.prompt<{ values: string[] }>([
        {
          type: "checkbox",
          name: "values",
          message: this.inquirerMessage,
          choices: this.options.map((option) => ({
            value: option.value,
            name: option.name,
          })),
          default: defaultValues,
        },
      ]);
      this.setValue(values.join(","));
    }
  }
}
