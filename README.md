# Ultima Forever

This is a static site built with Node.js. Node 20 or newer is required.

```sh
npm ci
npm run dev
```

Open `http://localhost:3001`. The development server builds the static site, serves `dist`, and rebuilds and reloads when a page, style, script, or image changes. To build without starting the preview, run `npm run build`; run `npm test` to check the build output. `npm start` builds the static site and serves the production output at `http://localhost:3000` without live reload.

## Azure Static Web Apps

The GitHub Actions workflow installs Node.js 22, runs `npm ci` and `npm run build`, then uploads the prebuilt `dist` directory with Azure Static Web Apps' build step skipped. No API location is needed. Azure serves the generated files directly; it does not run the Node preview server.

The beginning-era pages, restored 2013 middle-era pages, and the 2014 shutdown announcement ship with local images and styles in the generated `dist` site. The 2013 archive is available at `middle/`, including its English and localized Home and About pages; the shutdown-era farewell is at `end/`. The original App Store badge and social links remain visible; the Middle Home page includes embedded community feeds with profile-link fallbacks, while obsolete widget scripts and analytics are not loaded.