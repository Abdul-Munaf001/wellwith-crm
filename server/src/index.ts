import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import leadsRoutes from './routes/leads.routes.js';
import callsRoutes from './routes/calls.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import campaignsRoutes from './routes/campaigns.routes.js';
import followupsRoutes from './routes/followups.routes.js';
import consultationsRoutes from './routes/consultations.routes.js';
import enrollmentsRoutes from './routes/enrollments.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import aiTelecallingRoutes from './routes/ai-telecalling.routes.js';
import workspacesRoutes from './routes/workspaces.routes.js';
import usersRoutes from './routes/users.routes.js';
import settingsRoutes from './routes/settings.routes.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'WELLWITH CRM Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/followups', followupsRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/ai-telecalling', aiTelecallingRoutes);
app.use('/api/workspaces', workspacesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);

// Serve Client static files in production / unified mode
const candidatePaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
];
const clientDistPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('WELLWITH CRM API running. Start client Vite dev server on port 5173 or build client.');
    }
  });
});

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🌿 WELLWITH CRM Server running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  });
}

export default app;
