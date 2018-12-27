const fs = require("fs");
const globby = require("globby");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const chalk = require("chalk");

class Counter {
  constructor() {
    this._componentCounts = new Map();
    this._propCounts = new Map();
    this._i = 0;
    this._bar = "/-\\|";
  }

  incrementComponentUsage(component) {
    const prev = this._componentCounts.get(component) || 0;
    if (!prev) {
      this._propCounts.set(component, new Map());
    }
    this._componentCounts.set(component, prev + 1);
  }

  incrementComponentPropUsage(component, prop) {
    const map = this._propCounts.get(component);
    const prev = map.get(prop) || 0;
    map.set(prop, prev + 1);
  }

  getComponentReport(component) {
    const componentCount = this._componentCounts.get(component);
    const propCounts = [...this._propCounts.get(component)].map(
      ([name, count]) => ({ name, count })
    );
    propCounts.sort((a, b) => {
      if (b.count < a.count) {
        return -1;
      }
      if (b.count > a.count) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    return { componentCount, propCounts };
  }
}

const SPREAD_ATTRIBUTE_NAME = "{...}";

function getDottedName(node) {
  switch (node.type) {
    case "JSXMemberExpression":
      return [node.object, node.property].map(getDottedName).join(".");
    case "JSXIdentifier":
      return node.name;
    default:
      throw new Error(`unexpected node type: ${node.type}`);
  }
}

function getPropName(node) {
  switch (node.type) {
    case "JSXAttribute":
      return node.name.name;
    case "JSXSpreadAttribute":
      return SPREAD_ATTRIBUTE_NAME;
    default:
      throw new Error(`unexpected node type: ${node.type}`);
  }
}

function safeParse(filename) {
  try {
    return parse(fs.readFileSync(filename, "utf8"), {
      sourceType: "unambiguous",
      allowReturnOutsideFunction: true,
      plugins: [
        filename.endsWith(".tsx") ? "typescript" : "flow",
        "jsx",
        "dynamicImport",
        "classProperties",
        "objectRestSpread"
      ]
    });
  } catch (error) {
    console.log(error);
    if (error instanceof SyntaxError) {
      return null;
    }
    throw error;
  }
}

function updateUsageFromFile({ componentsSet, counter, filename }) {
  const ast = safeParse(filename);
  if (!ast) {
    console.error(`failed to parse ${filename}`);
    return;
  }
  traverse(ast, {
    enter(path) {
      if (path.type !== "JSXOpeningElement") {
        return;
      }
      const name = getDottedName(path.node.name);
      if (!componentsSet.has(name)) {
        return;
      }
      counter.incrementComponentUsage(name);
      if (path.parent.children.length > 0) {
        counter.incrementComponentPropUsage(name, "children");
      }
      for (const prop of path.node.attributes) {
        counter.incrementComponentPropUsage(name, getPropName(prop));
      }
    }
  });
}

function getUsage({ componentsSet, counter, options }) {
  const filenames = globby.sync(options.files, {
    cwd: options.directory || process.cwd(),
    gitignore: options.gitignore,
    absolute: true,
    onlyFiles: true
  });
  for (const filename of filenames) {
    updateUsageFromFile({ componentsSet, counter, filename });
  }
}

function textMeter(count, total) {
  const CHAR_BOX_FULL = "\u{2588}";
  const CHAR_BOX_LIGHT = "\u{2591}";
  const size = 10;
  let str = "";
  let first = Math.ceil((count / total) * size);
  let rest = size - first;
  while (first-- > 0) {
    str += CHAR_BOX_FULL;
  }
  while (rest-- > 0) {
    str += CHAR_BOX_LIGHT;
  }
  return str;
}

function props(component, otherComponents, options) {
  const componentsSet = new Set([component, ...otherComponents]);
  const counter = new Counter();
  getUsage({ componentsSet, counter, options });
  for (const comp of componentsSet) {
    printReport(comp, counter.getComponentReport(comp));
  }
}

function printHeading(...args) {
  console.log("\n\n" + chalk.bold(...args) + "\n");
}

function printReport(component, report) {
  const { componentCount, propCounts } = report;
  const word = componentCount === 1 ? "time" : "times";
  printHeading(
    `<${component}> was used ${componentCount} ${word}`,
    "with the following prop usage "
  );
  const maxLen = propCounts[0].count.toString().length;
  for (const { name, count } of propCounts) {
    console.log(
      [
        count.toString().padStart(maxLen),
        textMeter(count, componentCount),
        name
      ].join("  ")
    );
  }
}

exports.props = props;
