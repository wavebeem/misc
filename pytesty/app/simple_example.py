import trishula as T


def handle(d):
    print(d)
    return int(d["int"])


grammar = T.Namespace(T.Value("47") @ "int") >= handle


def main():
    for example in ('47', '"hi"'):
        result = T.Parser().parse(grammar, example)
        print(vars(result))


main()
