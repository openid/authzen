---
sidebar_position: 7
---

# PingAuthorize (ID Partners)

Interop results for the [ID Partners adapter for PingAuthorize](https://www.pingidentity.com/en/platform/capabilities/authorization/pingauthorize.html) implementation hosted at `https://authzen.idpartners.au`.

## Test results

```bash
AUTHZEN_PDP_API_KEY="<redacted>" yarn test https://authzen.idpartners.au markdown
yarn run v1.22.22
$ node build/runner.js https://authzen.idpartners.au markdown
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

