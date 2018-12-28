const program = require("commander");

const pkg = require("../package.json");
const props = require("./command-props").props;

program.version(pkg.version, "-v, --version");

// TODO:
// - Add option to sort alphabetically
// - Chart usage of components vs. each other
// - What should this package be called?
// - Should there even _be_ commands? Should this just be one command
// - Flag to disable colorized output

program
  .command("props [components...]")
  .description("counts the number of occurrences of each prop")
  .option("--no-gitignore", "disable reading .gitignore files")
  .option(
    "--directory <directory>",
    "directory to use as the base for finding files instead of cwd"
  )
  .option(
    "--files <pattern>",
    "glob pattern used to find input files",
    "**/*.{js,jsx,tsx}"
  )
  .action(props);

// Unknown command
program.on("command:*", () => {
  console.error("Invalid command: %s", program.args.join(" "));
  console.error();
  program.outputHelp();
  process.exit(1);
});

function main() {
  // No arguments
  if (process.argv.length === 2) {
    console.error("Error: no command given");
    console.error();
    program.outputHelp();
    process.exit(1);
  }
  program.parse(process.argv);
}

exports.main = main;
