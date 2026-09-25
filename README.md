# USSC Backend Server

Express + Socket.IO backend, with a React (Vite) frontend, for placing and
tracking street-light / PJU markers on a map (with 360° and normal photos
per marker, and live GPS broadcasting between connected clients).

## Project structure

```
database/
  init.sql              # schema, applied automatically on first run
backend/
  index.ts              # entrypoint: builds the app, starts HTTP + socket.io
  app.ts                # Express app: middleware, static files, routes
  config/
    env.ts              # single place that reads process.env
  db/
    database.ts         # mysql pool + first-run schema bootstrap
  realtime/
    socket.ts           # socket.io events (live location, marker broadcasts)
  routes/
    index.ts            # route barrel
    marker.routes.ts     # /marker CRUD endpoints
  services/
    image-storage.service.ts  # saving/removing marker photos on disk
  lib/
    panorama-splitter.ts # equirectangular -> multires cubemap tiles (pannellum)
frontend/                # Vite + React app
  App.tsx
  constants.ts
  components/
    map/                # map controls, feedback banner, measuring tool
    markers/            # marker list/editor/sidebar
    viewer/             # photo / 360 photo viewers
  util/
    format.ts           # marker icon, date, distance helpers
    services.ts         # REST client + socket client + image compression
public/                  # gitignored; created at runtime for uploaded photos
frontend/build/           # gitignored; vite build output, served at "/"
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
npm start       # Express + socket.io API server (backend/dist/index.js)
npm run build   # Builds the frontend into frontend/build/, served by the API server at "/"
```

For local development you'll typically run the API server (`npm start`) and
point the Vite dev server's requests at it, or run `npm run build` once and
let the Express server serve the built frontend directly.

## Notes on this structure

- `backend/index.ts` is the only entrypoint; `backend/app.ts` builds the Express app
  and `backend/realtime/socket.ts` wires up socket.io — kept apart so each stays
  readable and testable in isolation.
- Environment variables are only read in `backend/config/env.ts`; everything
  else imports `env` from there instead of touching `process.env` directly.
- Image read/write for marker photos lives in
  `backend/services/image-storage.service.ts`, separate from the HTTP route
  handlers in `backend/routes/marker.routes.ts`.
- There used to be a `views/index.ejs` file and an `ejs` dependency, but it
  was just a copy of the Vite build's `index.html` that the old `build`
  script overwrote on every build (`mv ./frontend/build/index.html
  ./views/index.ejs`) — since `express.static('frontend/build')` already serves
  that same `index.html` at `/`, the EJS render was dead code. Both were
  removed in this restructuring.
