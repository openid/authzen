---
sidebar_position: 9
---

# EmpowerID

Interop results for the [EmpowerID](https://www.empowerid.com/) implementation hosted at `https://pdp.authzen-demo.eidlabs.net`.

## Test results
```bash
yarn test https://pdp.authzen-demo.eidlabs.net markdown 
yarn run v1.22.22
$ node build/runner.js https://pdp.authzen-demo.eidlabs.net markdown
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

