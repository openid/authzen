---
sidebar_position: 2
---

# Topaz

Interop results for the [Topaz](https://www.topaz.sh/) implementation hosted at https://topaz-search.authzen-interop.net.

Note that as of Topaz 0.32.52, the AuthZEN APIs are provided natively (no need for a proxy).

## Test results

```bash
AUTHZEN_PDP_API_KEY="basic <redacted>" yarn test https://topaz-search.authzen-interop.net markdown
yarn run v1.22.19
$ node build/runner.js https://topaz-search.authzen-interop.net markdown
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
    "id": "alice"
  },
  "action": {
    "name": "delete"
  },
  "resource": {
    "type": "record"
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
    "id": "bob"
  },
  "action": {
    "name": "delete"
  },
  "resource": {
    "type": "record"
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
    "id": "carol"
  },
  "action": {
    "name": "delete"
  },
  "resource": {
    "type": "record"
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
    "id": "dan"
  },
  "action": {
    "name": "delete"
  },
  "resource": {
    "type": "record"
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
    "id": "erin"
  },
  "action": {
    "name": "delete"
  },
  "resource": {
    "type": "record"
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
    "id": "felix"
  },
  "action": {
    "name": "delete"
  },
  "resource": {
    "type": "record"
  }
}
```

  </td>
  </tr>
</table>
