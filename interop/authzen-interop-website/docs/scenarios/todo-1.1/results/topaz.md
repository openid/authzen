---
sidebar_position: 4
---

# Topaz

Interop results for the [Topaz](https://www.topaz.sh/) implementation hosted at https://topaz-todo-proxy.authzen-interop.net. Note that this implementation deploys a Topaz sidecar in the same pod as the proxy.

For more information, please refer to the [code](https://github.com/aserto-dev/authzen-topaz-proxy) and [playground](https://topaz-todo-proxy.authzen-interop.net), demonstrating the scenario.

## Test results

```bash
yarn test https://topaz-todo-proxy.authzen-interop.net  authorization-api-1_0-02 markdown
yarn run v1.22.19
$ node build/test/runner.js https://topaz-todo-proxy.authzen-interop.net authorization-api-1_0-02 markdown
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
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "beth@the-smiths.com"
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
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "rick@the-citadel.com"
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
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
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
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
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
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "rick@the-citadel.com"
    }
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
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "morty@the-citadel.com"
    }
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
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "rick@the-citadel.com"
    }
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
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "morty@the-citadel.com"
    }
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
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "beth@the-smiths.com"
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
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "morty@the-citadel.com"
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
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
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
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
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
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "rick@the-citadel.com"
    }
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
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "morty@the-citadel.com"
    }
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
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "rick@the-citadel.com"
    }
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
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "morty@the-citadel.com"
    }
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
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "beth@the-smiths.com"
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
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "summer@the-smiths.com"
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
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
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
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
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
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "rick@the-citadel.com"
    }
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
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "summer@the-smiths.com"
    }
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
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "rick@the-citadel.com"
    }
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
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "summer@the-smiths.com"
    }
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
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "beth@the-smiths.com"
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
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "beth@the-smiths.com"
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
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
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
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
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
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "rick@the-citadel.com"
    }
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
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "beth@the-smiths.com"
    }
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
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "rick@the-citadel.com"
    }
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
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "beth@the-smiths.com"
    }
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
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "beth@the-smiths.com"
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
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_read_user"
  },
  "resource": {
    "type": "user",
    "id": "jerry@the-smiths.com"
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
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
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
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
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
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "rick@the-citadel.com"
    }
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
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "jerry@the-smiths.com"
    }
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
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "rick@the-citadel.com"
    }
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
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_delete_todo"
  },
  "resource": {
    "type": "todo",
    "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
    "properties": {
      "ownerID": "jerry@the-smiths.com"
    }
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
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "evaluations": [
    {
      "resource": {
        "type": "todo",
        "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
        "properties": {
          "ownerID": "rick@the-citadel.com"
        }
      }
    },
    {
      "resource": {
        "type": "todo",
        "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
        "properties": {
          "ownerID": "jerry@the-smiths.com"
        }
      }
    }
  ]
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
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "evaluations": [
    {
      "resource": {
        "type": "todo",
        "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
        "properties": {
          "ownerID": "rick@the-citadel.com"
        }
      }
    },
    {
      "resource": {
        "type": "todo",
        "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
        "properties": {
          "ownerID": "morty@the-citadel.com"
        }
      }
    }
  ]
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
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "can_update_todo"
  },
  "evaluations": [
    {
      "resource": {
        "type": "todo",
        "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
        "properties": {
          "ownerID": "rick@the-citadel.com"
        }
      }
    },
    {
      "resource": {
        "type": "todo",
        "id": "7240d0db-8ff0-41ec-98b2-34a096273b9f",
        "properties": {
          "ownerID": "jerry@the-smiths.com"
        }
      }
    }
  ]
}
```

  </td>
  </tr>
</table>
