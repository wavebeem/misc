# TODO: Create a custom object format directly in bash to speed this up?
bap_obj_create() {
  ruby -r json -e '
    print(JSON.pretty_generate({}))
  '
}

bap_obj_set() {
  local key="$1"
  local value="$2"
  env key="$key" value="$value" ruby -r json -e '
    obj = JSON.parse(STDIN.read)
    obj[ENV["key"]] = ENV["value"]
    print(JSON.pretty_generate(obj))
  '
}

bap_obj_get() {
  local key="$1"
  env key="$key" ruby -r json -e '
    obj = JSON.parse(STDIN.read)
    print(obj[ENV["key"]])
  '
}

bap_parser_create() {
  local action="$1"
  bap_obj_create |
    bap_obj_set type "bap.parser" |
    bap_obj_set action "$action"
}

bap_result_ok() {
  local index="$1"
  local value="$2"
  bap_obj_create |
    bap_obj_set type "bap.result.ok" |
    bap_obj_set index "$index" |
    bap_obj_set value "$value"
}

bap_result_fail() {
  local index="$1"
  bap_obj_create |
    bap_obj_set type "bap.result.fail" |
    bap_obj_set index "$index"
}

bap_parse() {
  local parser="$1"
  local input="$2"
  local index="$3"
  local action="$(echo "$parser" | bap_obj_get action)"
  eval "$action"
}

bap_text() {
  local text="$1"
  local length="${#text}"
  # TODO: Not a safe way to emulate variable closure...
  bap_parser_create "
    local text='$text'
    local length='$length'
  "'
    if [[ "${input:$index:$length}" = "$text" ]]; then
      let "index += length"
      bap_result_ok $index "$text"
    else
      bap_result_fail $index
    fi
  '
}

bap_match() {
  local regexp="$1"
  # TODO: Not a safe way to emulate variable closure...
  bap_parser_create "
    local regexp='$regexp'
  "'
    if [[ "${input:$index}" =~ ^$regexp ]]; then
      local text="${BASH_REMATCH[0]}"
      local length="${#text}"
      let "index += length"
      bap_result_ok $index "$text"
    else
      bap_result_fail $index
    fi
  '
}

bap_or() {
  local pa="$1"
  local pb="$2"
  # TODO: Not a safe way to emulate variable closure...
  bap_parser_create "
    local pa='$pa'
    local pb='$pb'
  "'
    result="$(bap_parse "$pa" "$input" "$index")"
    if [[ $(echo "$result" | bap_obj_get type) = bap.result.ok ]]; then
      echo "$result"
    else
      bap_parse "$pb" "$input" "$index"
    fi
  '
}
