# Podcast Player

A lightweight web app for searching podcasts, browsing episodes, and listening in the browser. Podcast data is provided by the [Podcast Index API](https://podcastindex.org/).

## Features

- Search podcasts by title or topic
- Browse available episodes
- Play, pause, seek, and move between episodes
- Save and reuse recent searches
- Installable Progressive Web App assets

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   AUTH_KEY=your_podcast_index_auth_key
   SECRET_KEY=your_podcast_index_secret_key
   USER_AGENT=Podcast-Player
   API_ENDPOINT=https://api.podcastindex.org/api/1.0
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The server also accepts a custom port through the `PORT` environment variable.

## Tech stack

- HTML, CSS, and vanilla JavaScript
- Node.js and Express
- Podcast Index API
