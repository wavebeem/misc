const tokenize = require("./tokenize").tokenize;

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.i = 0;
    this.lastError = undefined;
  }

  expected(message) {
    this.lastError = message;
    return undefined;
  }

  consume(type) {
    const t = this.tokens[this.i];
    if (t.type === type) {
      this.i++;
      return t;
    }
    return undefined;
  }

  parse() {
    const node = this.parseAtom();
    if (node) {
      return node;
    }
    const index = this.tokens[this.i].start;
    throw new Error(`expected ${this.lastError} at character ${index}`);
  }

  parseAtom() {
    return (
      this.parseNumber() ||
      this.parseIdentifier() ||
      this.parseList() ||
      this.expected("number, identifier, or list")
    );
  }

  parseNumber() {
    return this.consume("Number") || this.expected("number");
  }

  parseIdentifier() {
    return this.consume("Identifier") || this.expected("identifier");
  }

  parseLeftParen() {
    return this.consume("LeftParen") || this.expected("(");
  }

  parseRightParen() {
    return this.consume("RightParen") || this.expected(")");
  }

  parseList() {
    const lp = this.parseLeftParen();
    if (!lp) {
      return undefined;
    }
    const items = [];
    let item = undefined;
    while ((item = this.parseAtom())) {
      items.push(item);
    }
    const rp = this.parseRightParen();
    if (!rp) {
      return undefined;
    }
    return {
      type: "List",
      values: items,
      start: lp.start,
      end: rp.end
    };
  }
}

function parse(input) {
  return new Parser(tokenize(input)).parse();
}

exports.parse = parse;
