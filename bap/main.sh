#!/usr/bin/env bash
set -eu

source bap.sh

abc="$(bap.text abc)"
def="$(bap.text def)"
a2z="$(bap.match '[a-z]+')"
choose="$(bap.or "$abc" "$def")"

# echo "$abc"

# echo "$(bap.parse "$choose" "abc" 0)"
# echo "$(bap.parse "$choose" "def" 0)"
# echo "$(bap.parse "$choose" "xxx" 0)"
echo "$(bap.parse "$a2z" "abcdefxyz" 0)"
