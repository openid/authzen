---
sidebar_position: 12
---

# Permit.io

Interop results for the [Permit.io](https://www.permit.io/) implementation hosted at [https://permit-authzen-interop.up.railway.app/](https://permit-authzen-interop.up.railway.app/).
For more details, refer to the [interop code and documentation](https://github.com/permitio/permit-authzen-interop)

## Test Results
```
./test.sh https://permit-authzen-interop.up.railway.app
>>> checking decisions
PASS REQ:{"subject":{"identity":"CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_user"},"resource":{"type":"user","userID":"beth@the-smiths.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_user"},"resource":{"type":"user","userID":"CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"}}
PASS REQ:{"subject":{"identity":"CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_todos"},"resource":{"type":"todo"}}
PASS REQ:{"subject":{"identity":"CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_create_todo"},"resource":{"type":"todo"}}
PASS REQ:{"subject":{"identity":"CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_update_todo"},"resource":{"type":"todo","ownerID":"rick@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_update_todo"},"resource":{"type":"todo","ownerID":"morty@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_delete_todo"},"resource":{"type":"todo","ownerID":"rick@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_delete_todo"},"resource":{"type":"todo","ownerID":"morty@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_user"},"resource":{"type":"user","userID":"beth@the-smiths.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_user"},"resource":{"type":"user","userID":"CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"}}
PASS REQ:{"subject":{"identity":"CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_todos"},"resource":{"type":"todo"}}
PASS REQ:{"subject":{"identity":"CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_create_todo"},"resource":{"type":"todo"}}
PASS REQ:{"subject":{"identity":"CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_update_todo"},"resource":{"type":"todo","ownerID":"rick@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_update_todo"},"resource":{"type":"todo","ownerID":"morty@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_delete_todo"},"resource":{"type":"todo","ownerID":"rick@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_delete_todo"},"resource":{"type":"todo","ownerID":"morty@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_user"},"resource":{"type":"user","userID":"beth@the-smiths.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_user"},"resource":{"type":"user","userID":"CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"}}
PASS REQ:{"subject":{"identity":"CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_todos"},"resource":{"type":"todo"}}
PASS REQ:{"subject":{"identity":"CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_create_todo"},"resource":{"type":"todo"}}
PASS REQ:{"subject":{"identity":"CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_update_todo"},"resource":{"type":"todo","ownerID":"rick@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_update_todo"},"resource":{"type":"todo","ownerID":"summer@the-smiths.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_delete_todo"},"resource":{"type":"todo","ownerID":"rick@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_delete_todo"},"resource":{"type":"todo","ownerID":"summer@the-smiths.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_user"},"resource":{"type":"user","userID":"beth@the-smiths.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_user"},"resource":{"type":"user","userID":"CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"}}
PASS REQ:{"subject":{"identity":"CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_todos"},"resource":{"type":"todo"}}
PASS REQ:{"subject":{"identity":"CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_create_todo"},"resource":{"type":"todo"}}
PASS REQ:{"subject":{"identity":"CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_update_todo"},"resource":{"type":"todo","ownerID":"rick@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_update_todo"},"resource":{"type":"todo","ownerID":"beth@the-smiths.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_delete_todo"},"resource":{"type":"todo","ownerID":"rick@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_delete_todo"},"resource":{"type":"todo","ownerID":"beth@the-smiths.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_user"},"resource":{"type":"user","userID":"beth@the-smiths.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_user"},"resource":{"type":"user","userID":"CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"}}
PASS REQ:{"subject":{"identity":"CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_read_todos"},"resource":{"type":"todo"}}
PASS REQ:{"subject":{"identity":"CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_create_todo"},"resource":{"type":"todo"}}
PASS REQ:{"subject":{"identity":"CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_update_todo"},"resource":{"type":"todo","ownerID":"rick@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_update_todo"},"resource":{"type":"todo","ownerID":"jerry@the-smiths.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_delete_todo"},"resource":{"type":"todo","ownerID":"rick@the-citadel.com"}}
PASS REQ:{"subject":{"identity":"CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"},"action":{"name":"can_delete_todo"},"resource":{"type":"todo","ownerID":"jerry@the-smiths.com"}}
<<< done checking decisions
```
