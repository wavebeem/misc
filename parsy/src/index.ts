type State = OK | Fail;
type Parser = (state: State) => IterableIterator<State>;

class OK {
  constructor(public input: string, public index: number, public value: any) {}
}

class Fail {
  constructor(
    public input: string,
    public index: number,
    public message: string
  ) {}
}

function nChar(size: number): Parser {
  return function*(state) {
    const end = state.index + size;
    if (end > state.input.length) {
      return new Fail(state.input, state.index, `${size} characters`);
    }
    return new OK(state.input, end, state.input.slice(state.index, end));
  };
}

function range(begin: string, end: string): Parser {
  return function*(state) {
    state = yield* nChar(1)(state);
    if (state instanceof OK && begin <= state.value && state.value <= end) {
      return state;
    } else {
      return new Fail(state.input, state.index, `"${begin}"-"${end}"`);
    }
  };
}

function map(parser: Parser, fn: (input: any) => any): Parser {
  return function*(state) {
    state = yield* parser(state);
    if (state instanceof OK) {
      return new OK(state.input, state.index, fn(state.value));
    }
    return state;
  };
}

function eof(): Parser {
  return function*(state) {
    if (state.index === state.input.length) {
      return new OK(state.input, state.index, undefined);
    }
    return new Fail(state.input, state.index, "EOF");
  };
}

function string(str: string): Parser {
  return function*(state) {
    state = yield* nChar(str.length)(state);
    if (state instanceof OK && state.value === str) {
      return state;
    } else {
      return new Fail(state.input, state.index, `"${str}"`);
    }
  };
}

function andThen(p1: Parser, p2: Parser): Parser {
  return function*(state: State) {
    state = yield* p1(state);
    if (state instanceof Fail) {
      return state;
    }
    const v1 = state.value;
    state = yield* p2(state);
    if (state instanceof Fail) {
      return state;
    }
    const v2 = state.value;
    return new OK(state.input, state.index, [v1, v2]);
  };
}

function first(p1: Parser, p2: Parser): Parser {
  return function*(state) {
    state = yield* seq([p1, p2])(state);
    if (state instanceof OK) {
      return new OK(state.input, state.index, state.value[0]);
    }
    return state;
  };
}

function seq(ps: Parser[]): Parser {
  return function*(state) {
    const values = [];
    for (const p of ps) {
      state = yield* p(state);
      if (state instanceof Fail) {
        return state;
      }
      values.push(state.value);
    }
    return new OK(state.input, state.index, values);
  };
}

function orElse(p1: any, p2: any): Parser {
  return function*(state) {
    state = yield* p1(state);
    if (state instanceof OK) {
      return state;
    }
    state = yield* p2(state);
    return state;
  };
}

function alt(ps: Parser[]): Parser {
  return function*(state) {
    for (const p of ps) {
      state = yield* p(state);
      if (state instanceof OK) {
        return state;
      }
    }
    return state;
  };
}

function _parse(fn: Parser, state: State) {
  const it = fn(state);
  let value = undefined;
  let done = undefined;
  do {
    ({ value, done } = it.next(state));
    if (value instanceof OK) {
      state.index = value.index;
    } else {
      return value;
    }
  } while (!done);
  return value;
}

function parse(parser: Parser, input: string): State {
  return _parse(first(parser, eof()), new OK(input, 0, undefined));
}

function main() {
  const p = string("abcd");
  console.log(parse(p, "abcd"));
  console.log(parse(p, "abcd"));
  console.log(parse(string("abcd"), "abcd"));
  console.log(parse(string("abc"), "abcd"));
  console.log(parse(andThen(string("ab"), string("cd")), "abcd"));
  console.log(parse(andThen(string("ab"), string("xy")), "abcd"));
  console.log(parse(orElse(string("xy"), string("abcd")), "abcd"));
  console.log(parse(orElse(string("abcd"), string("xy")), "abcd"));
  console.log(parse(alt([string("abcd"), string("xy")]), "abcd"));
  console.log(parse(seq([string("ab"), string("c"), string("d")]), "abcd"));
  console.log(parse(range("a", "z"), "a"));
  console.log(parse(range("a", "z"), "b"));
  console.log(parse(range("a", "z"), "c"));
  console.log(parse(range("a", "z"), "z"));
  console.log(parse(range("a", "z"), "!"));
}

main();
