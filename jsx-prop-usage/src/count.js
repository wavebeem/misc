const fs = require("fs");
const globby = require("globby");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;

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

function updateUsageFromFile({ usage, filename, component }) {
  const ast = safeParse(filename);
  if (!ast) {
    console.error(`failed to parse ${filename}`);
    return;
  }
  traverse(ast, {
    enter(path) {
      if (
        path.type === "JSXOpeningElement" &&
        getDottedName(path.node.name) === component
      ) {
        usage.componentCount++;
        if (path.parent.children.length > 0) {
          usage.propCounts.set("children", 1);
        }
        for (const prop of path.node.attributes) {
          const propName = getPropName(prop);
          const value = usage.propCounts.get(propName) || 0;
          usage.propCounts.set(propName, value + 1);
        }
      }
    }
  });
}

function getUsage(component, options) {
  const filenames = globby.sync(options.files, {
    cwd: options.directory || process.cwd(),
    gitignore: options.gitignore,
    absolute: true,
    onlyFiles: true
  });
  const usage = {
    componentCount: 0,
    propCounts: new Map()
  };
  for (const filename of filenames) {
    updateUsageFromFile({ usage, filename, component });
  }
  usage.propCounts = [...usage.propCounts].map(pair => ({
    name: pair[0],
    count: pair[1]
  }));
  return usage;
}

function textMeter(count, total) {
  let size = 10;
  const first = Math.ceil((count / total) * size);
  return chars.boxFull.repeat(first).padEnd(size, chars.boxLight);
}

const chars = {
  boxHoriz: "\u{2500}",
  boxVert: "\u{2502}",
  boxLight: "\u{2591}",
  boxFull: "\u{2588}"
};

function count(component, options) {
  const { componentCount, propCounts } = getUsage(component, options);
  if (propCounts.length > 0) {
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
    console.log(`Total prop usage for <${component}>`);
    console.log(chars.boxHoriz.repeat(30));
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
  console.log();
  console.log(`<${component}> was used ${componentCount} time(s)`);
}

exports.default = count;
