#!/usr/bin/env bash

AUTHZEN_PDP_URL=${1:-https://authzen-proxy.demo.aserto.com}
NO_COLOR='\033[0m'
OK_COLOR='\033[32;01m'
ERR_COLOR='\033[31;01m'
ATTN_COLOR='\033[33;01m'

echo ">>> checking decisions"
cat test/decisions.json | jq -c '.decisions[] ' | (
    while read BODY; do
        REQ=$(echo $BODY | jq '.request')
        EXP=$(echo $BODY | jq '.expected')
        RSP=$(curl -s -H "Authorization: ${AUTHZEN_PDP_API_KEY}" -H 'content-type:application/json' -d "${REQ}" ${AUTHZEN_PDP_URL}/access/v1/evaluation | jq '.decision // false')
        if [ "$EXP" = "$RSP" ]; then
            echo -e "${OK_COLOR}PASS${NO_COLOR} REQ:$(echo ${REQ} | jq -c .)"
        else
            echo -e "${ERR_COLOR}FAIL${NO_COLOR} REQ:$(echo ${REQ} | jq -c .) ${ATTN_COLOR}EXP:$(echo ${EXP} | jq -c .)${NO_COLOR}"
        fi
    done
)
echo "<<< done checking decisions"
echo -e "\n"
