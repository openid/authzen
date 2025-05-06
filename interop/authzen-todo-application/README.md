# AuthZEN Interop React Todo Application

This is the front-end for a React Todo application, which is authorized using the AuthZEN evaluations API.

In addition to providing a standard Todo interface based on the [TodoMVC](https://todomvc.com) template and [CSS](https://github.com/tastejs/todomvc-app-css), the application allows a user to select from a set of AuthZEN-compatible Policy Decision Points (PDPs) which provide externalized authorization for the application routes.

## Running the front end

`yarn`

`yarn start`

## Backend

This sample requires a backend that implements the Todo API.

The [authzen-todo-backend](https://github.com/openid/authzen/tree/main/interop/authzen-todo-backend) repo contains a Node.JS implementation of the API, which calls an AuthZEN-compliant Policy Decision Point (PDP) to authorize each request. See instructions in that repo for how to build, configure, and run the backend.

Alternatively, the backend is hosted [here](https://todo-backend.authzen-interop.net). The `.env` file in this repo set the `REACT_APP_API_ORIGIN` environment variable to this service. If you'd like to point it instead to your own backend, simply change the value of this variable (e.g. `http://localhost:8080`).

## Identities

This sample uses a demo identity provider called "Citadel", with built-in users such as Rick and Morty. They all using the same password: ` V@erySecre#t123!`

| User | Email | 
| --- | --- |
| Rick Sanchez | rick@the-citadel.com | 
| Morty Smith | morty@the-citadel.com |
| Beth Smith | beth@the-smiths.com |
| Summer Smith | summer@the-smiths.com |
| Jerry Smith | jerry@the-smiths.com |
