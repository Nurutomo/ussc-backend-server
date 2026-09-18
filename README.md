# USSC Backend Server

Express + Socket.IO backend, with a React (Vite) frontend, for placing and
tracking street-light / PJU markers on a map (with 360° and normal photos
per marker, and live GPS broadcasting between connected clients).

## Project structure

```
database/
  init.sql              # schema, applied automatically on first run
src/
  index.js              # entrypoint: builds the app, starts HTTP + socket.io
  app.js                # Express app: middleware, static files, routes
  config/
    env.js              # single place that reads process.env
  db/
    database.js         # mysql pool + first-run schema bootstrap
  realtime/
    socket.js           # socket.io events (live location, marker broadcasts)
  routes/
    index.js            # route barrel
    marker.routes.js     # /marker CRUD endpoints
  services/
    image-storage.service.js  # saving/removing marker photos on disk
  lib/
    panorama-splitter.js # equirectangular -> multires cubemap tiles (pannellum)
frontend/                # Vite + React app
  App.jsx
  constants.js
  components/
    map/                # map controls, feedback banner, measuring tool
    markers/            # marker list/editor/sidebar
    viewer/             # photo / 360 photo viewers
  util/
    format.js           # marker icon, date, distance helpers
    services.js          # REST client + socket client + image compression
public/                  # gitignored; created at runtime for uploaded photos
buildReact/               # gitignored; vite build output, served at "/"
```

## Setup

```bash
npm install
cp .env.example .env   # then fill in your DB_* values
```

The `marker` table and database are created automatically on first boot from
`database/init.sql` — no manual migration step needed.

## Running

```bash
npm run dev     # Vite dev server for the frontend (frontend/)
npm start       # Express + socket.io API server (src/index.js)
npm run build   # Builds the frontend into buildReact/, served by the API server at "/"
```

For local development you'll typically run the API server (`npm start`) and
point the Vite dev server's requests at it, or run `npm run build` once and
let the Express server serve the built frontend directly.

## Notes on this structure

- `src/index.js` is the only entrypoint; `src/app.js` builds the Express app
  and `src/realtime/socket.js` wires up socket.io — kept apart so each stays
  readable and testable in isolation.
- Environment variables are only read in `src/config/env.js`; everything
  else imports `env` from there instead of touching `process.env` directly.
- Image read/write for marker photos lives in
  `src/services/image-storage.service.js`, separate from the HTTP route
  handlers in `src/routes/marker.routes.js`.
- There used to be a `views/index.ejs` file and an `ejs` dependency, but it
  was just a copy of the Vite build's `index.html` that the old `build`
  script overwrote on every build (`mv ./buildReact/index.html
  ./views/index.ejs`) — since `express.static('buildReact')` already serves
  that same `index.html` at `/`, the EJS render was dead code. Both were
  removed in this restructuring.
