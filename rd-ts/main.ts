interface XToken {
  type: "XToken";
  name: string;
  value: string;
  start: number;
  end: number;
}

class Tokenizer {
  input: string;
  index: number;
  tokens: XToken[];
  state: string[];
  chunk: string;

  constructor(input: string) {
    this.input = input;
    this.index = 0;
    this.tokens = [];
    this.state = ["Default"];
    this.chunk = "";
  }

  emit(name: string): void {
    const j = this.index + this.chunk.length;
    this.tokens.push({
      type: "XToken",
      name,
      value: this.chunk,
      start: this.index,
      end: j - 1,
    });
    this.index = j;
  }

  ignore(): void {
    this.index += this.chunk.length;
  }

  match(regexp: RegExp, state: string = "Default"): boolean {
    if (this.state[this.state.length - 1] !== state) {
      return false;
    }
    // TODO: Respect /i flag on regexp
    const re = new RegExp(regexp.source, "y");
    re.lastIndex = this.index;
    const m = this.input.match(re);
    if (m) {
      this.chunk = m[0];
      return true;
    }
    return false;
  }

  beginState(state: string): void {
    this.state.push(state);
  }

  endState(): void {
    this.state.pop();
  }

  tokenize(): XToken[] {
    const n = this.input.length;
    while (this.index < n) {
      if (this.match(/"/)) {
        this.emit("StringStart");
        this.beginState("String");
      } else if (this.match(/[a-z ]+/, "String")) {
        this.emit("StringChunk");
      } else if (this.match(/\{/, "String")) {
        this.emit("StringInterpolationStart");
        this.beginState("Default");
      } else if (this.match(/\}/)) {
        this.emit("StringInterpolationEnd");
        this.endState();
      } else if (this.match(/"/, "String")) {
        this.emit("StringEnd");
        this.endState();
      } else if (this.match(/\(/)) {
        this.emit("LeftParen");
      } else if (this.match(/\)/)) {
        this.emit("RightParen");
      } else if (this.match(/\s+/)) {
        this.ignore();
      } else if (this.match(/;.*/)) {
        this.ignore();
      } else if (this.match(/[a-z]+/)) {
        this.emit("Symbol");
      } else {
        throw new Error(`parse error at character ${this.index + 1}`);
      }
    }
    return this.tokens;
  }
}

interface XNode {
  type: string;
  start: number;
  end: number;
}

interface XList extends XNode {
  type: "XList";
  items: XAtom[];
}

interface XSymbol extends XNode {
  type: "XSymbol";
  value: string;
}

interface XString extends XNode {
  type: "XString";
  chunks: (string | XAtom)[];
}

type XAtom = XSymbol | XString | XList;

class Parser {
  index: number;
  tokens: XToken[];
  // error: string;

  constructor(tokens: XToken[]) {
    this.index = 0;
    this.tokens = tokens;
    // this.error = "";
  }

  accept(name: string): XToken | undefined {
    const token = this.tokens[this.index];
    if (token.name === name) {
      this.index++;
      return token;
    }
    return undefined;
  }

  parseAtom(): XAtom | undefined {
    return this.parseSymbol() || this.parseString() || this.parseList();
  }

  parseString(): XString | undefined {
    const lq = this.accept("StringStart");
    if (!lq) {
      return undefined;
    }
    const chunks: (string | XAtom)[] = [];
    let chunk = this.parseStringChunk();
    while (chunk !== undefined) {
      chunks.push(chunk);
      chunk = this.parseStringChunk();
    }
    const rq = this.accept("StringEnd");
    if (!rq) {
      return undefined;
    }
    return {
      type: "XString",
      chunks,
      start: lq.start,
      end: rq.end,
    };
  }

  parseStringChunk(): string | XAtom | undefined {
    const str = this.accept("StringChunk");
    if (str) {
      return str.value;
    }
    const start = this.accept("StringInterpolationStart");
    if (!start) {
      return undefined;
    }
    const interp = this.parseAtom();
    if (!interp) {
      return undefined;
    }
    const end = this.accept("StringInterpolationEnd");
    if (!end) {
      return undefined;
    }
    return interp;
  }

  parseSymbol(): XSymbol | undefined {
    const token = this.accept("Symbol");
    if (!token) {
      return undefined;
    }
    return {
      type: "XSymbol",
      value: token.value,
      start: token.start,
      end: token.end,
    };
  }

  parseListItems(): XAtom[] | undefined {
    const items: XAtom[] = [];
    let atom = this.parseAtom();
    while (atom) {
      items.push(atom);
      atom = this.parseAtom();
    }
    return items;
  }

  parseList(): XList | undefined {
    const lp = this.accept("LeftParen");
    if (!lp) {
      return undefined;
    }
    const items = this.parseListItems();
    if (!items) {
      return undefined;
    }
    const rp = this.accept("RightParen");
    if (!rp) {
      return undefined;
    }
    return {
      type: "XList",
      items,
      start: lp.start,
      end: rp.end,
    };
  }

  parse(): XAtom | undefined {
    return this.parseAtom();
    // TODO: What if we have leftover tokens?
  }
}

class Serializer {
  node: XAtom;

  constructor(node: XAtom) {
    this.node = node;
  }

  toJSON(): any {
    return this.helper(this.node);
  }

  helper(node: XAtom): any {
    switch (node.type) {
      case "XString":
        return [
          "string",
          ...node.chunks.map((c) => {
            if (typeof c === "string") {
              return c;
            }
            return this.helper(c);
          }),
        ];
      case "XSymbol":
        return node.value;
      case "XList":
        return node.items.map((item) => this.helper(item));
      default:
        throw new Error(`unknown type ${(node as any).type}`);
    }
  }
}

function main() {
  // const code = `"abc{"d{e}f"}g"`;
  const code = `

  ; comment
  (define (g cool a b) ; nice
    (list (f a b) (cool) "hello {world}"))

  `;
  const tokens = new Tokenizer(code).tokenize();
  console.log(tokens);
  const node = new Parser(tokens).parse();
  console.log();
  console.log(node);
  if (node) {
    const json = new Serializer(node).toJSON();
    console.log();
    console.log(json);
  }
}

main();
