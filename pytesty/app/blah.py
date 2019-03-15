import trishula as T

print(dir(T))
print()


def m(f):
    return lambda x: T.Node(x.status, x.index, f(x.value))


p_number = T.Regexp(r"[0-9\.]+") @ m(float)


def wrap(begin, end, content):
    return (T.Value(begin) >> content >> T.Value(end)) @ m(lambda x: x[0][1])

p_list_inner = (
    p_number |
    (T.Regexp(r",\s*") >> p_list_inner)
)

p_list = wrap("[", "]", p_list_inner | (T.Value("") @ mapper(lambda _: [])))


result = T.Parser().parse(grammar, "[3.14]")
print(vars(result))
