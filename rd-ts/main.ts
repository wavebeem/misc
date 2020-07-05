import { inspect } from "util";
import { Parser, Result, Tokenizer, ok, many, all, parse } from "./parser";

function show(value: any): string {
  return inspect(value, { colors: true, depth: null });
}

class LispTokenizer extends Tokenizer<LispToken, TokenizerState> {
  next(): void {
    if (this.match(/"/)) {
      this.emit("StringStart");
      this.beginState("String");
    } else if (this.match(/[a-z ]+/, "String")) {
      this.emit("StringChunk");
    } else if (this.match(/\{/, "String")) {
      this.emit("LeftBrace");
      this.beginState("Default");
    } else if (this.match(/\}/)) {
      this.emit("RightBrace");
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
  parseAtom(): Result<LispAtom> {
    return this.parseSymbol()
      .or(() => this.parseString())
      .or(() => this.parseList());
  }

  parseSymbol(): Result<LispSymbol> {
    return this.chain("Symbol", (token) => {
      return ok({
        type: "LispSymbol",
        value: token.value,
        start: token.start,
        end: token.end,
      });
    });
  }

  parseString(): Result<LispString> {
    return all([
      () => this.consume("StringStart"),
      () => many(() => this.parseStringChunk()),
      () => this.consume("StringEnd"),
    ]).chain(([start, chunks, end]) => {
      return ok({
        type: "LispString",
        chunks,
        start: start.start,
        end: end.end,
      });
    });
  }

  parseStringChunk(): Result<string | LispAtom> {
    return this.chain("StringChunk", (str) => ok(str.value)).or(() =>
      this.parseStringInterp()
    );
  }

  parseStringInterp(): Result<LispAtom> {
    return all([
      () => this.consume("LeftBrace"),
      () => this.parseAtom(),
      () => this.consume("RightBrace"),
    ]).chain(([_start, interp, _end]) => {
      return ok(interp);
    });
  }

  parseList(): Result<LispList> {
    return all([
      () => this.consume("LeftParen"),
      () => many(() => this.parseAtom()),
      () => this.consume("RightParen"),
    ]).chain(([lp, items, rp]) => {
      return ok({
        type: "LispList",
        items,
        start: lp.start,
        end: rp.end,
      });
    });
  }

  parse(): Result<LispAtom> {
    return this.parseAtom();
    // TODO: What if we have leftover tokens?
  }
}

type TokenizerState = "String" | "Default";

type LispToken =
  | "StringStart"
  | "StringChunk"
  | "LeftBrace"
  | "RightBrace"
  | "StringEnd"
  | "LeftParen"
  | "RightParen"
  | "Symbol";

// const code = `"abc{"d{e}f"}g"`;
const code = "()()";
// const code = `

//   ; comment
//   (define (g cool a b world) ; nice
//     (list (f a b) (cool) "hello {world}"))

//   `;

// const tokens = new LispTokenizer().tokenize(code);
// console.log(show(tokens));

// const node = new LispParser().parseTokens(tokens);
// console.log();
// console.log(show(node));

const node = parse(new LispTokenizer(), new LispParser(), code);
console.log(show(node));
