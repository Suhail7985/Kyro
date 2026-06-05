# Kyro Backend API

Express + MongoDB API for the HRMS platform.

## Scripts

- `npm run dev` – development with nodemon
- `npm start` – production (Heroku)
- `npm test` – Jest (passes with no tests by default)

## Environment Variables

See `.env.example` in this folder.

## Heroku

`Procfile` runs `node src/app.js`. Set all env vars in Heroku Config Vars. Note: Heroku ephemeral filesystem – uploaded files may be lost on dyno restart; use S3 for production persistence.
