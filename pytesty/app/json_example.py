import trishula as T


def sep_by(content, separator):
    single = content >= (lambda x: [x])
    multi = T.Namespace(
        (content @ "item") >>
        separator >>
        (T.Ref(lambda: sep_by(content, separator)) @ "rest")
    ) >= (lambda d: [d["item"], *x["rest"]])
    return multi | single

# TODO: Escape characters
json_string = T.Namespace(
    T.Value("\"") >>
    (T.Regexp(r"[^\"]+") @ "value") >>
    T.Value("\"")
) >= (lambda d: d["value"])

json_array = (
    sep_by(T.Ref(lambda: json_value), T.Regexp(r",\s+")) |
    (T.Value("[]") >= (lambda _: []))
)


def handle_json_number(d):
    print(d)
    # return float("".join((d["int"], d["frac"], d["exp"])))
    return float(d["int"])


json_number = T.Namespace(
    # (T.Regexp(r"[1-9][0-9]*") @ "int")
    (T.Regexp(r"[1-9][0-9]*") @ "int") >>
    (T.Regexp(r"(\.[0-9]+)?") @ "frac") >>
    (T.Regexp(r"([eE][+-]?[0-9]+)?") @ "exp")
) >= handle_json_number
# ) >= (lambda d: d)

json_true = T.Value("true") >= (lambda _: True)
json_false = T.Value("false") >= (lambda _: False)
json_null = T.Value("null") >= (lambda _: None)

json_value = (
    json_true |
    json_false |
    json_null |
    json_number |
    json_string |
    json_array
)


def main():
    examples = (
        '"hi"',
        # "true",
        # "false",
        # "null",
        # "2",
        # "3.1",
        # "4",
        # "03.14",
        # "3.0140E-1",
    )
    for ex in examples:
        result = T.Parser().parse(json_value, ex)
        print(vars(result))


main()
