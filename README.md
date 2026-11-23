# Ultima Forever

This is a static site built with Node.js. Node 20 or newer is required.

```sh
npm ci
npm run dev
```

Open `http://localhost:3001`. The development server serves the source files and automatically reloads open pages when HTML, CSS, JavaScript, or image files change. To build without starting the preview, run `npm run build`; run `npm test` to check the build output. `npm start` builds the static site and serves the production output at `http://localhost:3000` without live reload.

## Azure Static Web Apps

The GitHub Actions workflow installs Node.js 22, runs `npm ci` and `npm run build`, then uploads the prebuilt `dist` directory with Azure Static Web Apps' build step skipped. No API location is needed. Azure serves the generated files directly; it does not run the Node preview server.

All website images are shipped in the local `images` directory and copied into the generated `dist` site.