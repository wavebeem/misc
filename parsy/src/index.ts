import * as P from "./Parsy";

function main() {
  const p = P.string("abcd");
  console.log(P.parse(p, "abcd"));
  console.log(P.parse(p, "abcd"));
  console.log(P.parse(P.string("abcd"), "abcd"));
  console.log(P.parse(P.string("abc"), "abcd"));
  console.log(P.parse(P.andThen(P.string("ab"), P.string("cd")), "abcd"));
  console.log(P.parse(P.andThen(P.string("ab"), P.string("xy")), "abcd"));
  console.log(P.parse(P.orElse(P.string("xy"), P.string("abcd")), "abcd"));
  console.log(P.parse(P.orElse(P.string("abcd"), P.string("xy")), "abcd"));
  console.log(P.parse(P.alt([P.string("abcd"), P.string("xy")]), "abcd"));
  console.log(
    P.parse(P.seq([P.string("ab"), P.string("c"), P.string("d")]), "abcd")
  );
  console.log(P.parse(P.range("a", "z"), "a"));
  console.log(P.parse(P.range("a", "z"), "b"));
  console.log(P.parse(P.range("a", "z"), "c"));
  console.log(P.parse(P.range("a", "z"), "z"));
  console.log(P.parse(P.range("a", "z"), "!"));
}

main();
