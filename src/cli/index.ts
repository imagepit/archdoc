import { Command } from "commander";
import { registerGenerateCommand } from "./commands/generate.js";
import { registerInitCommand } from "./commands/init.js";
import { registerDriftCommand } from "./commands/drift.js";
import { registerDiagramCommand } from "./commands/diagram.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("archdoc")
    .description(
      "Generate DDD layered architecture API documentation from TypeScript source code",
    )
    .version("0.1.0");

  registerInitCommand(program);
  registerGenerateCommand(program);
  registerDriftCommand(program);
  registerDiagramCommand(program);

  return program;
}
