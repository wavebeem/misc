#!/usr/bin/env bash
set -eu

source bap.sh

abc="$(bap_text abc)"
def="$(bap_text def)"
a2z="$(bap_match '[a-z]+')"
choose="$(bap_or "$abc" "$def")"

echo "$(bap_parse "$choose" "abc" 0)"
echo "$(bap_parse "$choose" "def" 0)"
echo "$(bap_parse "$choose" "xxx" 0)"
echo "$(bap_parse "$a2z" "abcdefxyz" 0)"
