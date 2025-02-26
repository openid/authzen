---
sidebar_position: 7
---

# SGNL

Interop results for the [SGNL](https://sgnl.ai) implementation hosted at [authzen.sgnlapis.cloud](https://authzen.sgnlapis.cloud).

## Test results

```bash
AUTHZEN_PDP_API_KEY="Bearer <redacted>" yarn test https://authzen.sgnlapis.cloud markdown
yarn run v1.22.19
$ node build/runner.js https://authzen.sgnlapis.cloud markdown
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
    "type": "identity",
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "GET"
  },
  "resource": {
    "type": "route",
    "id": "/users/{userId}"
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
    "type": "identity",
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "GET"
  },
  "resource": {
    "type": "route",
    "id": "/todos"
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
    "type": "identity",
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "POST"
  },
  "resource": {
    "type": "route",
    "id": "/todos"
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
    "type": "identity",
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "PUT"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
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
    "type": "identity",
    "id": "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "DELETE"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
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
    "type": "identity",
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "GET"
  },
  "resource": {
    "type": "route",
    "id": "/users/{userId}"
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
    "type": "identity",
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "GET"
  },
  "resource": {
    "type": "route",
    "id": "/todos"
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
    "type": "identity",
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "POST"
  },
  "resource": {
    "type": "route",
    "id": "/todos"
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
    "type": "identity",
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "PUT"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
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
    "type": "identity",
    "id": "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "DELETE"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
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
    "type": "identity",
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "GET"
  },
  "resource": {
    "type": "route",
    "id": "/users/{userId}"
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
    "type": "identity",
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "GET"
  },
  "resource": {
    "type": "route",
    "id": "/todos"
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
    "type": "identity",
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "POST"
  },
  "resource": {
    "type": "route",
    "id": "/todos"
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
    "type": "identity",
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "PUT"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
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
    "type": "identity",
    "id": "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "DELETE"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
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
    "type": "identity",
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "GET"
  },
  "resource": {
    "type": "route",
    "id": "/users/{userId}"
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
    "type": "identity",
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "GET"
  },
  "resource": {
    "type": "route",
    "id": "/todos"
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
    "type": "identity",
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "POST"
  },
  "resource": {
    "type": "route",
    "id": "/todos"
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
    "type": "identity",
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "PUT"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
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
    "type": "identity",
    "id": "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "DELETE"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
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
    "type": "identity",
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "GET"
  },
  "resource": {
    "type": "route",
    "id": "/users/{userId}"
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
    "type": "identity",
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "GET"
  },
  "resource": {
    "type": "route",
    "id": "/todos"
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
    "type": "identity",
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "POST"
  },
  "resource": {
    "type": "route",
    "id": "/todos"
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
    "type": "identity",
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "PUT"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
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
    "type": "identity",
    "id": "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs"
  },
  "action": {
    "name": "DELETE"
  },
  "resource": {
    "type": "route",
    "id": "/todos/{todoId}"
  }
}
```

  </td>
  </tr>
</table>

