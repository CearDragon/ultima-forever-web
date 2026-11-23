# Ultima Forever

This is a static site built with Node.js. Node 20 or newer is required.

```sh
npm ci
npm start
```

Open `http://localhost:3000`. To build without starting the preview, run `npm run build`. Run `npm test` to check the build output.

## Azure Static Web Apps

Configure the deployment with **App location** `/`, **App build command** `npm run build`, and **Output location** `dist`. No API location is needed. Azure serves the generated files directly; it does not run the Node preview server.

The site includes historical content and some images hosted by the Internet Archive, so those resources depend on that service being available.