const util = require("util");

const tokenize = require("./tokenize").tokenize;
const parse = require("./parse").parse;

function show(x) {
  console.log(util.inspect(x, { colors: "auto", depth: null }));
}

const code = `
# just a comment
# and another

# and also that blank line


(print (list 1 2 3 ok cool))

# final comment
`;

console.log();
console.log("TOKEN LIST");
console.log("----------");
show(tokenize(code));

console.log();
console.log("SYNTAX TREE");
console.log("-----------");
show(parse(code));
