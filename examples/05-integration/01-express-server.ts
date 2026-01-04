/**
 * Example 12: Integration with Express.js
 *
 * This example shows how to integrate @oxog/config with Express.
 */

import express from 'express';
import { loadConfig } from '@oxog/config';

async function main() {
  // Load configuration
  const config = await loadConfig({
    name: 'express-server',
    paths: ['./config.json'],
  });

  const app = express();
  const port = config.get('port', 3000);
  const host = config.get('host', 'localhost');

  // Use config values in your app
  app.get('/config', (req, res) => {
    res.json(config.toObject());
  });

  app.get('/config/:path', (req, res) => {
    const value = config.get(req.params.path);
    res.json({ path: req.params.path, value });
  });

  app.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}`);
  });
}

main().catch(console.error);
