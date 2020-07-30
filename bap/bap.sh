# TODO: Create a custom object format directly in bash to speed this up?
bap.obj.create() {
  echo -n ""
}

bap.obj.set() {
  local obj="$(cat)"
  local key="$1"
  local value="$2"
  echo -n "${#key}:$key=${#value}:$value;$obj"
}

bap.obj.get() {
  local target="$1"
  local key
  local key_length
  local value
  local value_length
  local _
  while IFS= read -rd ":" key_length; do
    IFS= read -rd "" -n "$key_length" key
    IFS= read -rd "=" _
    IFS= read -rd ":" value_length
    IFS= read -rd "" -n "$value_length" value
    IFS= read -rd ";" _
    if [[ $key = $target ]]; then
      echo "$value"
      return
    fi
  done
  echo "no such key $target" >&2
}

bap.parser.create() {
  local action="$1"
  bap.obj.create |
    bap.obj.set action "$action" |
    bap.obj.set type "bap.parser"
}

bap.result.ok() {
  local index="$1"
  local value="$2"
  bap.obj.create |
    bap.obj.set value "$value" |
    bap.obj.set index "$index" |
    bap.obj.set type "bap.result.ok"
}

bap.result.fail() {
  local index="$1"
  bap.obj.create |
    bap.obj.set index "$index" |
    bap.obj.set type "bap.result.fail"
}

bap.parse() {
  local parser="$1"
  local input="$2"
  local index="$3"
  local action="$(echo "$parser" | bap.obj.get action)"
  eval "$action"
}

bap.text() {
  local text="$1"
  local length="${#text}"
  # TODO: Not a safe way to emulate variable closure...
  bap.parser.create "
    local text='$text'
    local length='$length'
  "'
    if [[ "${input:$index:$length}" = "$text" ]]; then
      let "index += length"
      bap.result.ok $index "$text"
    else
      bap.result.fail $index
    fi
  '
}

bap.match() {
  local regexp="$1"
  # TODO: Not a safe way to emulate variable closure...
  bap.parser.create "
    local regexp='$regexp'
  "'
    if [[ "${input:$index}" =~ ^$regexp ]]; then
      local text="${BASH_REMATCH[0]}"
      local length="${#text}"
      let "index += length"
      bap.result.ok $index "$text"
    else
      bap.result.fail $index
    fi
  '
}

bap.or() {
  local pa="$1"
  local pb="$2"
  # TODO: Not a safe way to emulate variable closure...
  bap.parser.create "
    local pa='$pa'
    local pb='$pb'
  "'
    result="$(bap.parse "$pa" "$input" "$index")"
    if [[ $(echo "$result" | bap.obj.get type) = bap.result.ok ]]; then
      echo "$result"
    else
      bap.parse "$pb" "$input" "$index"
    fi
  '
}
