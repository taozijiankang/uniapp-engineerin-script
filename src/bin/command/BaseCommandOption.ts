import { Command } from "commander";
import inquirer from "inquirer";
import { ConfirmType } from "../../constants/enum.js";
import { ConfirmTypeDicts } from "../../constants/dicts.js";

export abstract class BaseCommandOption {
  name: string;
  description: string;
  value?: string | boolean;

  inquirerMessage?: string;

  constructor(options: { name: string; description: string; inquirerMessage?: string }) {
    this.name = options.name;
    this.description = options.description;
    this.inquirerMessage = options.inquirerMessage;
  }

  abstract register(command: Command): Promise<void> | void;

  abstract setValue(value?: string | boolean): this;

  abstract inquirer(): Promise<void> | void;
}

export class BooleanCommandOption extends BaseCommandOption {
  declare value?: boolean;

  register(command: Command): void {
    command.option(`--${this.name}`, this.description);
  }

  setValue(value?: boolean): this {
    this.value = value;
    return this;
  }

  async inquirer(deValue?: ConfirmType): Promise<void> {
    const { value } = await inquirer.prompt<{ value: ConfirmType }>([
      {
        type: "list",
        name: "value",
        message: this.inquirerMessage || "请选择选项：",
        default: deValue || ConfirmType.YES,
        choices: ConfirmTypeDicts.map((item) => ({
          value: item.value,
          name: item.label,
        })),
      },
    ]);
    this.setValue(value === ConfirmType.YES);
  }
}

export class StringCommandOption extends BaseCommandOption {
  declare value?: string;

  defValue?: string;

  constructor(options: { name: string; description: string; defValue?: string }) {
    super(options);

    this.defValue = options.defValue;
  }

  register(command: Command): void {
    command.option(`--${this.name} <${this.name}>`, this.description, this.defValue);
  }

  setValue(value?: string): this {
    this.value = value;
    return this;
  }

  async inquirer(deValue?: string): Promise<void> {
    const { value } = await inquirer.prompt<{ value: string }>([
      {
        type: "input",
        name: "value",
        message: this.inquirerMessage || "请输入选项：",
        default: deValue,
      },
    ]);
    this.setValue(value);
  }
}
