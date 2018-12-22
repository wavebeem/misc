const glob = require("glob");
const program = require("commander");
const { parse } = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");

const pkg = require("./package.json");

function count(component) {
  console.log(`TODO: count ${component}`);
}

function main() {
  program
    .version(pkg.version)
    .command("count <component>")
    .description(
      "counts the number of occurrences of each prop for a component"
    )
    .option("--files <files>", "glob pattern used to find input files")
    .action(count)
    .parse(process.argv);
}

main();
