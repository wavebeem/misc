const fs = require("fs");
const glob = require("glob");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;

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
      return "{...}";
    default:
      throw new Error(`unexpected node type: ${node.type}`);
  }
}

function getUsage({ component, files, directory }) {
  const filenames = glob.sync(files, {
    cwd: directory,
    absolute: true
  });
  const usage = new Map();
  for (const f of filenames) {
    const ast = parse(fs.readFileSync(f, "utf-8"), {
      sourceType: "unambiguous",
      plugins: ["jsx", "typescript", "classProperties", "objectRestSpread"]
    });
    traverse(ast, {
      enter(path) {
        if (path.type === "JSXOpeningElement") {
          if (getDottedName(path.node.name) === component) {
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
      }
    });
  }
  return [...usage].map(pair => ({
    name: pair[0],
    count: pair[1]
  }));
}

function count(component, options) {
  const { files, directory } = options;
  const usage = getUsage({ component, files, directory });
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
