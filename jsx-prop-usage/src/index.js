const program = require("commander");

const pkg = require("../package.json");
const count = require("./count").default;

program.version(pkg.version, "-v, --version");

program
  .command("count <component>")
  .description("counts the number of occurrences of each prop for a component")
  .option(
    "--directory <directory>",
    "directory to use as the base for finding files"
  )
  // TODO: Rename these two options to include/exclude, maybe?
  .option(
    "--ignore <pattern>",
    "glob pattern used to ignore files; can be specified more than once"
  )
  .option(
    "--files <pattern>",
    "glob pattern used to find input files",
    "**/*.{js,jsx,tsx}"
  )
  .action(count);

// No arguments
if (process.argv.length === 2) {
  program.help();
}

// Unknown command
program.on("command:*", () => {
  console.error("Invalid command: %s", program.args.join(" ") + "\n");
  program.outputHelp();
  process.exit(1);
});

program.parse(process.argv);
