# AuthZEN Search Demo App

Supports:

- Resource search
- Action search
- Subject search
- Metadata

Expects the PDP configuration to be passed as a base64 encoded JSON object env variable called `PDP_CONFIG` like the following:

```json
{
  "Cerbos": {
    "host": "https://authzen-proxy-demo.cerbos.dev"
  },
  "Topaz": {
    "host": "https://topaz-search.authzen-interop.net",
    "headers": {
      "Authorization": "basic <sometoke"
    }
  }
}
```

## Getting Started

### Installation

Install the dependencies:

```bash
yarn
```

### Development

Start the development server with HMR:

```bash
yarn dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
yarn build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 8080:8080 my-app
```
