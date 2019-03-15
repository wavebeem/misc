import trishula as T


def p_list():
    non_empty = (
        T.Value("(") >>
        T.Ref(p_list) >>
        T.Value(")")
    ) >= (lambda x: x[0][1])
    empty = T.Value("()") >= (lambda _: [])
    return empty | non_empty


def grammar():
    return p_list()


def main():
    print(dir(T))
    print()
    result = T.Parser().parse(grammar(), "(())")
    print(vars(result))


def m(f):
    def g(x):
        if x.status == T.Status.SUCCEED:
            return T.Node(x.status, x.index, f(x.value))
        return x
    return g


main()
