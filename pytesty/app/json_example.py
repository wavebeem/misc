import trishula as T


def sep_by1(content, separator):
    single = content >= (lambda x: [x])
    another = (separator >> content) >= (lambda x: x[1])
    multi = (content >> +another) >= (lambda x: [x[0], *x[1]])
    return multi | single


def sep_by(content, separator):
    return sep_by1(content, separator) | (T.Value("") >= (lambda _: []))


json_ws = T.Regexp(r"[ \n\r\t]*")


# TODO: JSON strings are complicated and I'm feeling lazy
#
# string = quotation-mark *char quotation-mark
#
# char = unescaped /
#     escape (
#         %x22 /          ; "    quotation mark  U+0022
#         %x5C /          ; \    reverse solidus U+005C
#         %x2F /          ; /    solidus         U+002F
#         %x62 /          ; b    backspace       U+0008
#         %x66 /          ; f    form feed       U+000C
#         %x6E /          ; n    line feed       U+000A
#         %x72 /          ; r    carriage return U+000D
#         %x74 /          ; t    tab             U+0009
#         %x75 4HEXDIG )  ; uXXXX                U+XXXX
#
# escape = %x5C              ; \
#
# quotation-mark = %x22      ; "
#
# unescaped = %x20-21 / %x23-5B / %x5D-10FFFF
json_string = T.Namespace(
    T.Value('"') >> (T.Regexp(r"[^\"]+") @ "value") >> T.Value('"')
) >= (lambda d: d["value"])

json_sep = json_ws >> T.Value(",") >> json_ws

json_array = T.Namespace(
    T.Value("[")
    >> json_ws
    >> (sep_by(T.Ref(lambda: json_value), json_sep) @ "items")
    >> json_ws
    >> T.Value("]")
) >= (lambda d: d["items"])

json_pair = T.Namespace(
    (json_string @ "key")
    >> json_ws
    >> T.Value(":")
    >> json_ws
    >> (T.Ref(lambda: json_value) @ "value")
) >= (lambda d: (d["key"], d["value"]))

json_pairs = sep_by(json_pair, json_sep) >= dict

json_object = T.Namespace(
    T.Value("{")
    >> json_ws
    >> (json_pairs @ "object")
    >> json_ws
    >> T.Value("}")
) >= (lambda d: d["object"])


def handle_json_number(d):
    chunks = (d["int"], d["frac"], d["exp"])
    return float("".join(chunks))


json_number = (
    T.Namespace(
        (T.Regexp(r"[1-9][0-9]*") @ "int")
        >> (T.Regexp(r"(\.[0-9]+)?") @ "frac")
        >> (T.Regexp(r"([eE][+-]?[0-9]+)?") @ "exp")
    )
    >= handle_json_number
)

json_true = T.Value("true") >= (lambda _: True)
json_false = T.Value("false") >= (lambda _: False)
json_null = T.Value("null") >= (lambda _: None)

json_value = T.Namespace(
    json_ws
    >> (
        (
            json_true
            | json_false
            | json_null
            | json_number
            | json_string
            | json_array
            | json_object
        )
        @ "value"
    )
    >> json_ws
) >= (lambda d: d["value"])


def main():
    examples = (
        '"hi"',
        "false",
        "null",
        "  \r\t true     \n",
        "2",
        "3.1",
        "4",
        "[1]",
        '[[1, ["a"]], 2]',
        # Fail: JSON disallows starting with 0 to avoid octal numbers
        "03.14",
        "{}",
        '{"a": 1, "b":[{}, {}]}',
        "3.0140E-1",
    )
    for ex in examples:
        result = T.Parser().parse(json_value, ex)
        print(vars(result))


main()
