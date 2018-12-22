const program = require("commander");

const pkg = require("../package.json");
const count = require("./count").default;

program.version(pkg.version, "-v, --version");

// TODO: Should there be a flag (default=ON?) to exclude node_modules?

program
  .command("count <component>")
  .description("counts the number of occurrences of each prop for a component")
  .option(
    "--directory <directory>",
    "directory to use as the base for finding files"
  )
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

program.parse(process.argv);
