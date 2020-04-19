function tokenize(input) {
  const tokens = [];
  let s = input;
  const n = s.length;
  let i = 0;
  let start = 0;
  let end = 0;
  let text = undefined;
  const consume = regexp => {
    const m = s.match(regexp);
    if (m) {
      text = m[0];
      start = i;
      i += text.length;
      end = i;
      s = input.slice(i);
      return true;
    }
    text = undefined;
    return false;
  };
  const emit = (type, value) => {
    tokens.push({ type, value, start, end });
  };
  while (i < n) {
    if (consume(/^[+-]?[0-9]+/)) {
      emit("Number", Number(text));
    } else if (consume(/^[a-zA-Z_-][a-zA-Z0-9_-]*/)) {
      emit("Identifier", text);
    } else if (consume(/^\(/)) {
      emit("LeftParen", "(");
    } else if (consume(/^\)/)) {
      emit("RightParen", ")");
    } else if (consume(/^#.*\n/)) {
      // Ignore comments
    } else if (consume(/^\s+/)) {
      // Ignore whitespace
    } else {
      throw new Error(`unexpected input: ${JSON.stringify(s)}`);
    }
  }
  return tokens;
}

exports.tokenize = tokenize;
