const program = require("commander");

const pkg = require("../package.json");
const props = require("./props").props;

program.version(pkg.version, "-v, --version");

program
  .command("props <component>")
  .description("counts the number of occurrences of each prop for a component")
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
