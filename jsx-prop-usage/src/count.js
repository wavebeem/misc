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
    return parse(fs.readFileSync(filename, "utf-8"), {
      sourceType: "unambiguous",
      plugins: [
        filename.endsWith(".tsx") ? "typescript" : "flow",
        "jsx",
        "classProperties",
        "objectRestSpread"
      ]
    });
  } catch (error) {
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
        if (path.parent.children.length > 0) {
          usage.set("children", 1);
        }
        for (const prop of path.node.attributes) {
          const propName = getPropName(prop);
          const value = usage.get(propName) || 0;
          usage.set(propName, value + 1);
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
  const usage = new Map();
  for (const filename of filenames) {
    updateUsageFromFile({ usage, filename, component });
  }
  return [...usage].map(pair => ({
    name: pair[0],
    count: pair[1]
  }));
}

function count(component, options) {
  const usage = getUsage(component, options);
  if (usage.length > 0) {
    usage.sort((a, b) => {
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
    const maxLen = usage[0].count.toString().length;
    for (const { name, count } of usage) {
      console.log(count.toString().padStart(maxLen), name);
    }
  }
}

exports.default = count;
