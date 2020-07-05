import { Parser, Result, ResultOK, ResultFail, Tokenizer } from "./parser";

class LispTokenizer extends Tokenizer<LispToken, TokenizerState> {
  next(): void {
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
}

interface LispNode {
  type: string;
  start: number;
  end: number;
}

interface LispList extends LispNode {
  type: "LispList";
  items: LispAtom[];
}

interface LispSymbol extends LispNode {
  type: "LispSymbol";
  value: string;
}

interface LispString extends LispNode {
  type: "LispString";
  chunks: (string | LispAtom)[];
}

type LispAtom = LispSymbol | LispString | LispList;

class LispParser extends Parser<LispToken, LispAtom> {
  parseAtom(): LispAtom | undefined {
    return this.parseSymbol() || this.parseString() || this.parseList();
  }

  parseAtom2(): Result<1 | 2 | 3> {
    return this.parseSymbol2()
      .or(() => this.take("RightParen").map((t) => t))
      .or(() => this.take("Symbol").map((t) => t));
    // return this.take("LeftParen").or(() => this.take("RightParen"));
  }

  parseSymbol2(): Result<LispSymbol> {
    return this.takeFlatMap("Symbol", (token) => {
      return new ResultOK({
        type: "LispSymbol",
        value: token.value,
        start: token.start,
        end: token.end,
      });
    });
  }

  parseStringChunk2(): Result<string | LispAtom> {
    return this.takeFlatMap("StringChunk", (str) => {
      return this.takeFlatMap("StringInterpolationStart", (start) => {});
    });
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

  parseString2(): Result<LispString> {
    return this.takeFlatMap("StringStart", (lq) => {
      const chunks: (string | LispAtom)[] = [];
      let chunk = this.parseStringChunk2();
      while (chunk.ok()) {
        chunks.push(chunk);
        chunk = this.parseStringChunk2();
      }
      return this.takeFlatMap("StringEnd", (rq) => {
        return new ResultOK({
          type: "LispString",
          chunks,
          start: lq.start,
          end: rq.end,
        });
      });
    });
  }

  parseString(): LispString | undefined {
    const lq = this.accept("StringStart");
    if (!lq) {
      return undefined;
    }
    const chunks: (string | LispAtom)[] = [];
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
      type: "LispString",
      chunks,
      start: lq.start,
      end: rq.end,
    };
  }

  parseStringChunk(): string | LispAtom | undefined {
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

  parseSymbol(): LispSymbol | undefined {
    return this.chain("Symbol", (token) => ({
      type: "LispSymbol",
      value: token.value,
      start: token.start,
      end: token.end,
    }));
  }

  parseListItems(): LispAtom[] | undefined {
    const items: LispAtom[] = [];
    let atom = this.parseAtom();
    while (atom) {
      items.push(atom);
      atom = this.parseAtom();
    }
    return items;
  }

  parseList(): LispList | undefined {
    return this.chain("LeftParen", (lp) => {
      const items = this.parseListItems();
      if (!items) {
        return undefined;
      }
      return this.chain("RightParen", (rp) => {
        return {
          type: "LispList",
          items,
          start: lp.start,
          end: rp.end,
        };
      });
    });
  }

  parse(): Result<LispAtom> {
    return this.parseAtom2();
    // TODO: What if we have leftover tokens?
  }
}

type TokenizerState = "String" | "Default";

type LispToken =
  | "StringStart"
  | "StringChunk"
  | "StringInterpolationStart"
  | "StringInterpolationEnd"
  | "StringEnd"
  | "LeftParen"
  | "RightParen"
  | "Symbol";

// const code = `"abc{"d{e}f"}g"`;
const code = `

  ; comment
  (define (g cool a b world) ; nice
    (list (f a b) (cool) "hello {world}"))

  `;

const tokens = new LispTokenizer().tokenize(code);
console.log(tokens);

const node = new LispParser(tokens).parse();
console.log();
console.log(node);
