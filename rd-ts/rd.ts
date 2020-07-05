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

interface BaseResult<A> {
  ok(): boolean;
  map<B>(fn: (a: A) => B): Result<B>;
  chain<B>(fn: (a: A) => Result<B>): Result<B>;
  or<B>(_fn: () => Result<B>): Result<A | B>;
}

class ResultOK<A> implements BaseResult<A> {
  value: A;

  constructor(value: A) {
    this.value = value;
  }

  ok() {
    return true;
  }

  map<B>(fn: (a: A) => B): Result<B> {
    return ok(fn(this.value));
  }

  chain<B>(fn: (a: A) => Result<B>): Result<B> {
    return fn(this.value);
  }

  or<B>(_fn: () => Result<B>): Result<A | B> {
    return ok(this.value);
  }
}

class ResultFail<A> implements BaseResult<A> {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  ok() {
    return false;
  }

  map<B>(_fn: (a: A) => B): Result<B> {
    return fail(this.message);
  }

  chain<B>(_fn: (a: A) => Result<B>): Result<B> {
    return fail(this.message);
  }

  or<B>(fn: () => Result<B>): Result<A | B> {
    return fn();
  }
}

export abstract class Tokenizer<Name extends string, State extends string> {
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

  constructor() {
    this.index = 0;
    this.tokens = [];
    // this.error = "";
  }

  consume(name: Name): Result<Token<Name>> {
    const token = this.tokens[this.index];
    if (token.name === name) {
      this.index++;
      return ok(token);
    }
    return fail(name);
  }

  chain<T>(name: Name, fn: (token: Token<Name>) => Result<T>): Result<T> {
    const token = this.consume(name);
    if (token.ok()) {
      return token.chain(fn);
    }
    return fail(name);
  }

  parseTokens(tokens: Token<Name>[]): Result<Node> {
    this.tokens = tokens;
    return this.parse();
  }

  abstract parse(): Result<Node>;
}

export function ok<A>(value: A): Result<A> {
  return new ResultOK(value);
}

export function fail<A>(message: string): Result<A> {
  return new ResultFail(message);
}

export function many<A>(fn: () => Result<A>): Result<A[]> {
  const items: A[] = [];
  let result = fn();
  while (result.ok()) {
    result.map((value) => {
      items.push(value);
    });
  }
  return ok(items);
}

export function all<A>(funcs: readonly [() => Result<A>]): Result<[A]>;

export function all<A, B>(
  funcs: readonly [() => Result<A>, () => Result<B>]
): Result<[A, B]>;

export function all<A, B, C>(
  funcs: readonly [() => Result<A>, () => Result<B>, () => Result<C>]
): Result<[A, B, C]>;

export function all<A, B, C, D>(
  funcs: readonly [
    () => Result<A>,
    () => Result<B>,
    () => Result<C>,
    () => Result<D>
  ]
): Result<[A, B, C, D]>;

export function all<A, B, C, D, E>(
  funcs: readonly [
    () => Result<A>,
    () => Result<B>,
    () => Result<C>,
    () => Result<D>,
    () => Result<E>
  ]
): Result<[A, B, C, D, E]>;

export function all<A, B, C, D, E, F>(
  funcs: readonly [
    () => Result<A>,
    () => Result<B>,
    () => Result<C>,
    () => Result<D>,
    () => Result<E>,
    () => Result<F>
  ]
): Result<[A, B, C, D, E, F]>;

export function all<T>(funcs: Iterable<() => Result<T>>): Result<T[]> {
  const ary = [...funcs] as const;
  if (ary.length === 0) {
    return ok([]);
  }
  const [fnFirst, ...fnRest] = ary;
  return fnFirst().chain((first) => {
    // Can't figure out how to make TypeScript happy here without `as any` :(
    return all<T>(fnRest as any).chain((rest) => {
      return ok([first, ...rest]);
    });
  });
}

export function parse<
  Node,
  Name extends string,
  State extends string,
  T extends Tokenizer<Name, State>,
  P extends Parser<Name, Node>
>(tokenizer: T, parser: P, code: string): Result<Node> {
  const tokens = tokenizer.tokenize(code);
  const node = parser.parseTokens(tokens);
  return node;
}
