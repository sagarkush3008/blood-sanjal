import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Instead of hardcoding their activeStatusRouter, since this is a separate app,
// I'll leave a proxy or mount point based on their snippet.
// Actually, since their previous snippet explicitly imported it:
// import { activeStatusRouter } from './src/server/routes/activeStatusRoutes';
// I will just put the code they gave me exactly as is, so it doesn't break their flow.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Info Index
  app.get('/api', (_req, res) => {
    res.json({
      name: 'Blood Sanjal API - Active Status Feature',
      version: '1.0.0',
      status: 'online',
      endpoints: {
        activeStatus: '/api/active-status',
        activeSummary: '/api/active-status/summary',
        activeDonors: '/api/active-status/donors',
        activeRequests: '/api/active-status/requests',
        heartbeat: '/api/active-status/heartbeat',
        liveStream: '/api/active-status/stream',
        auditHistory: '/api/active-status/audit-history'
      }
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Blood Sanjal] Server running at http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
