<p align="center">
  <img src="resources/themes/librefront-logo.svg" alt="LibreFront logo" width="360">
</p>

<p align="center">Real-time strategy game played in the browser.</p>

## About

**LibreFront** is an open-source real-time strategy game played in the browser.

## Building

Node.js (>= 20) and npm are required.

```bash
git clone https://github.com/Danilikopro/LibreFront.git
cd LibreFront
git submodule update --init --recursive
npm ci
npm run dev
```

The development server starts at `http://localhost:8080/`. Create a production build with:

```bash
npm run build-prod
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.
