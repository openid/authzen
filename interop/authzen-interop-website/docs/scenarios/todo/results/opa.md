---
sidebar_position: 8
---

# Open Policy Agent

Interop results for the [OPA](https://openpolicyagent.org/) implementation hosted at `https://authzen-opa-proxy.demo.aserto.com`.

## Test results

```bash
yarn test https://authzen-opa-proxy.demo.aserto.com markdown
yarn run v1.22.19
$ node build/test/runner.js https://authzen-opa-proxy.demo.aserto.com markdown
```
<table>
  <tr>
    <th>result</th>
    <th>request</th>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "rick@the-citadel.com",
    "identity": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "userID": "beth@the-smiths.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "rick@the-citadel.com",
    "identity": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "rick@the-citadel.com",
    "userID": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "rick@the-citadel.com",
    "identity": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_todos"
  },
  "resource": {
    "type": "todo",
    "id": "todo-1"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "rick@the-citadel.com",
    "identity": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_create_todo"
  },
  "resource": {
    "type": "todo",
    "id": "todo-1"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "rick@the-citadel.com",
    "identity": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "rick@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "rick@the-citadel.com",
    "identity": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "morty@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "rick@the-citadel.com",
    "identity": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "rick@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "rick@the-citadel.com",
    "identity": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "morty@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "morty@the-citadel.com",
    "identity": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "userID": "beth@the-smiths.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "morty@the-citadel.com",
    "identity": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "morty@the-citadel.com",
    "userID": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "morty@the-citadel.com",
    "identity": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_todos"
  },
  "resource": {
    "type": "todo",
    "id": "todo-1"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "morty@the-citadel.com",
    "identity": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_create_todo"
  },
  "resource": {
    "type": "todo",
    "id": "todo-1"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "morty@the-citadel.com",
    "identity": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "rick@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "morty@the-citadel.com",
    "identity": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "morty@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "morty@the-citadel.com",
    "identity": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "rick@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "morty@the-citadel.com",
    "identity": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "morty@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "summer@the-smiths.com",
    "identity": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "userID": "beth@the-smiths.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "summer@the-smiths.com",
    "identity": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "summer@the-smiths.com",
    "userID": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "summer@the-smiths.com",
    "identity": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_todos"
  },
  "resource": {
    "type": "todo",
    "id": "todo-1"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "summer@the-smiths.com",
    "identity": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_create_todo"
  },
  "resource": {
    "type": "todo",
    "id": "todo-1"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "summer@the-smiths.com",
    "identity": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "rick@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "summer@the-smiths.com",
    "identity": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "summer@the-smiths.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "summer@the-smiths.com",
    "identity": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "rick@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "summer@the-smiths.com",
    "identity": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "summer@the-smiths.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "identity": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "userID": "beth@the-smiths.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "identity": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "userID": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "identity": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_todos"
  },
  "resource": {
    "type": "todo",
    "id": "todo-1"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "identity": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_create_todo"
  },
  "resource": {
    "type": "todo",
    "id": "todo-1"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "identity": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "rick@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "identity": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "beth@the-smiths.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "identity": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "rick@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "identity": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "beth@the-smiths.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "jerry@the-smiths.com",
    "identity": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "beth@the-smiths.com",
    "userID": "beth@the-smiths.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "jerry@the-smiths.com",
    "identity": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "jerry@the-smiths.com",
    "userID": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "jerry@the-smiths.com",
    "identity": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_todos"
  },
  "resource": {
    "type": "todo",
    "id": "todo-1"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "jerry@the-smiths.com",
    "identity": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_create_todo"
  },
  "resource": {
    "type": "todo",
    "id": "todo-1"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "jerry@the-smiths.com",
    "identity": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "rick@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "jerry@the-smiths.com",
    "identity": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "jerry@the-smiths.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "jerry@the-smiths.com",
    "identity": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "rick@the-citadel.com"
  }
}
```

  </td>
  </tr>
  <tr>
    <td bgColor="green">PASS</td>
    <td>

```js
{
  "subject": {
    "type": "user",
    "id": "jerry@the-smiths.com",
    "identity": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "ownerID": "jerry@the-smiths.com"
  }
}
```

  </td>
  </tr>
</table>