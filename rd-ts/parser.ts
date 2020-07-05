export class Token<Name extends string> {
  name: Name;
  value: string;
  // TODO: Make a SourceLocation type for line/column/index numbers
  start: number;
  end: number;

  constructor(options: {
    name: Name;
    value: string;
    // TODO: Make a TokenLocation type for line/column/index numbers
    start: number;
    end: number;
  }) {
    this.name = options.name;
    this.value = options.value;
    this.start = options.start;
    this.end = options.end;
  }
}

export type Result<A> = ResultOK<A> | ResultFail<A>;

export class ResultOK<A> {
  value: A;

  constructor(value: A) {
    this.value = value;
  }

  ok() {
    return true;
  }

  map<B>(fn: (a: A) => B): Result<B> {
    return new ResultOK(fn(this.value));
  }

  flatMap<B>(fn: (a: A) => Result<B>): Result<B> {
    return fn(this.value);
  }

  or<B>(_fn: () => Result<B>): Result<A | B> {
    return new ResultOK(this.value);
  }
}

export class ResultFail<A> {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  ok() {
    return false;
  }

  map<B>(_fn: (a: A) => B): Result<B> {
    return new ResultFail(this.message);
  }

  flatMap<B>(_fn: (a: A) => Result<B>): Result<B> {
    return new ResultFail(this.message);
  }

  or<B>(fn: () => Result<B>): Result<A | B> {
    return fn();
  }
}

export abstract class Tokenizer<
  Name extends string,
  State extends "Default" | string
> {
  input: string;
  index: number;
  tokens: Token<Name>[];
  state: State[];
  chunk: string;

  constructor() {
    this.input = "";
    this.index = 0;
    this.tokens = [];
    this.state = ["Default" as State];
    this.chunk = "";
  }

  emit(name: Name): void {
    const j = this.index + this.chunk.length;
    this.tokens.push({
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

  match(regexp: RegExp, state: State = "Default" as State): boolean {
    if (this.state[this.state.length - 1] !== state) {
      return false;
    }
    const re = new RegExp(regexp.source, regexp.ignoreCase ? "iy" : "y");
    re.lastIndex = this.index;
    const m = this.input.match(re);
    if (m) {
      this.chunk = m[0];
      return true;
    }
    return false;
  }

  beginState(state: State): void {
    this.state.push(state);
  }

  endState(): void {
    this.state.pop();
  }

  tokenize(input: string): Token<Name>[] {
    this.index = 0;
    this.tokens = [];
    this.state = ["Default" as State];
    this.chunk = "";
    this.input = input;
    const n = this.input.length;
    while (this.index < n) {
      this.next();
    }
    return this.tokens;
  }

  abstract next(): void;
}

export abstract class Parser<Name extends string, Node> {
  index: number;
  tokens: Token<Name>[];
  // error: string;

  constructor(tokens: Token<Name>[]) {
    this.index = 0;
    this.tokens = tokens;
    // this.error = "";
  }

  accept(name: Name): Token<Name> | undefined {
    const token = this.tokens[this.index];
    if (token.name === name) {
      this.index++;
      return token;
    }
    return undefined;
  }

  take(name: Name): Result<Token<Name>> {
    const token = this.accept(name);
    if (token) {
      return new ResultOK(token);
    }
    return new ResultFail(name);
  }

  takeFlatMap<T>(name: Name, fn: (token: Token<Name>) => Result<T>): Result<T> {
    const token = this.accept(name);
    if (token) {
      return new ResultOK(token).flatMap(fn);
    }
    return new ResultFail(name);
  }

  chain<T>(name: Name, fn: (token: Token<Name>) => T): T | undefined {
    const token = this.accept(name);
    if (token) {
      return fn(token);
    }
    return undefined;
  }

  abstract parse(): Result<Node>;
}
