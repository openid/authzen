# Envoy AuthZEN External Authroizer

A basic [External Authorization](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/ext_authz_filter) filter for Envoy.

```
docker compose up
```

Then the todo application backend will be avaliable on `localhost:9000` with all requests being authorized by the configured PDP.

Make sure configure the frontend app to use this endpoint rather than `authzen-todo-backend.demo.aserto.com` directly as the Envoy proxy is configured to forward on the request if it is allowed.
