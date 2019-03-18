export type State = OK | Fail;
export type Parser = (state: State) => IterableIterator<State>;

export class OK {
  constructor(public input: string, public index: number, public value: any) {}
}

export class Fail {
  constructor(
    public input: string,
    public index: number,
    public message: string
  ) {}
}

export function nChar(size: number): Parser {
  return function*(state) {
    const end = state.index + size;
    if (end > state.input.length) {
      return new Fail(state.input, state.index, `${size} characters`);
    }
    return new OK(state.input, end, state.input.slice(state.index, end));
  };
}

export function range(begin: string, end: string): Parser {
  return function*(state) {
    state = yield* nChar(1)(state);
    if (state instanceof OK && begin <= state.value && state.value <= end) {
      return state;
    } else {
      return new Fail(state.input, state.index, `"${begin}"-"${end}"`);
    }
  };
}

export function map(parser: Parser, fn: (input: any) => any): Parser {
  return function*(state) {
    state = yield* parser(state);
    if (state instanceof OK) {
      return new OK(state.input, state.index, fn(state.value));
    }
    return state;
  };
}

export function many1(parser: Parser): Parser {
  throw new Error("TODO: Implement");
}

export function many0(parser: Parser): Parser {
  throw new Error("TODO: Implement");
}

export function sepBy1(parser: Parser): Parser {
  throw new Error("TODO: Implement");
}

export function sepBy0(parser: Parser): Parser {
  throw new Error("TODO: Implement");
}

export function eof(): Parser {
  return function*(state) {
    if (state.index === state.input.length) {
      return new OK(state.input, state.index, undefined);
    }
    return new Fail(state.input, state.index, "EOF");
  };
}

export function string(str: string): Parser {
  return function*(state) {
    state = yield* nChar(str.length)(state);
    if (state instanceof OK && state.value === str) {
      return state;
    } else {
      return new Fail(state.input, state.index, `"${str}"`);
    }
  };
}

export function andThen(p1: Parser, p2: Parser): Parser {
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

export function first(ps: Parser[]): Parser {
  return function*(state) {
    state = yield* seq(ps)(state);
    if (state instanceof OK) {
      return new OK(state.input, state.index, state.value[0]);
    }
    return state;
  };
}

export function last(ps: Parser[]): Parser {
  return function*(state) {
    state = yield* seq(ps)(state);
    if (state instanceof OK) {
      return new OK(
        state.input,
        state.index,
        state.value[state.value.length - 1]
      );
    }
    return state;
  };
}

export function seq(ps: Parser[]): Parser {
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

export function orElse(p1: any, p2: any): Parser {
  return function*(state) {
    state = yield* p1(state);
    if (state instanceof OK) {
      return state;
    }
    state = yield* p2(state);
    return state;
  };
}

export function alt(ps: Parser[]): Parser {
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

export function parse(parser: Parser, input: string): State {
  return _parse(first([parser, eof()]), new OK(input, 0, undefined));
}
