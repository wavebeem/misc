import json
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

# character
# '0020' . '10FFFF' - '"' - '\'
# '\' escape

# escape
# '"'
# '\'
# '/'
# 'b'
# 'n'
# 'r'
# 't'
# 'u' hex hex hex hex

json_quote = T.Value('\\"') >= (lambda: '"')
json_backslash = T.Value("\\\\") >= (lambda: "\\")
json_slash = T.Value("\\/") >= (lambda: "/")
json_backspace = T.Value("\\b") >= (lambda: "\b")
json_lf = T.Value("\\n") >= (lambda: "\n")
json_cr = T.Value("\\r") >= (lambda: "\r")
json_tab = T.Value("\\t") >= (lambda: "\t")
json_unicode = (T.Value("\\u") >> T.Regexp(r"[a-zA-Z0-9]{4}")) >= (
    lambda x: chr(int(x[1], base=16))
)
json_char_escaped = (
    json_quote
    | json_backslash
    | json_slash
    | json_backspace
    | json_lf
    | json_cr
    | json_tab
    | json_unicode
)
json_char_unescaped = T.Regexp(r"[^\"\\]+")
json_char = json_char_escaped | json_char_unescaped


def handle_json_string(d):
    s = "".join(d["value"])
    s = s.encode("utf-8", "surrogatepass").decode("utf-8", "strict")
    return s


json_string = (
    T.Namespace(T.Value('"') >> (~json_char @ "value") >> T.Value('"'))
    >= handle_json_string
)

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
        json.dumps("hi"),
        json.dumps(True),
        json.dumps(None),
        "  \r\t true     \n",
        json.dumps(2),
        json.dumps(3.1),
        json.dumps(4),
        json.dumps([[1, ["a"]], 2]),
        # TODO: Handle surrogate pairs correctly
        '"\\uD834\\uDD1E"',
        # Fail: JSON disallows starting with 0 to avoid octal numbers
        "03.14",
        json.dumps({}),
        json.dumps({"a": 1, "b": [{}, {}]}),
        "3.0140E-1",
    )
    for ex in examples:
        result = T.Parser().parse(json_value, ex)
        if result.status == T.Status.SUCCEED:
            print()
            print("Input  :", repr(ex))
            print("Output :", repr(result.value))
        else:
            print()
            print("Input  :", repr(ex))
            print("Fail   :", vars(result))


main()
