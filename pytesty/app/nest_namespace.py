import trishula as T


inner = T.Namespace(
    (T.Regexp(r".") @ "first") >>
    (T.Regexp(r".") @ "last")
) >= (lambda d: d)

outer = T.Namespace(
    (T.Regexp(r".") @ "begin") >>
    (inner @ "value") >>
    (T.Regexp(r".") @ "end")
) >= (lambda d: d)


def main():
    examples = (
        "abcd",
        "ab",
    )
    for ex in examples:
        result = T.Parser().parse(outer, ex)
        print(vars(result))


main()
