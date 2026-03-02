import express from 'express';
import cors from 'cors';
import { SERVICES_LIST, generateService } from './mock-data';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize Services
const services = SERVICES_LIST.map((name, index) => 
  generateService(`srv-${index}`, name)
);

export function startMockServer() {
  // GET /api/services
  app.get('/api/services', (req, res) => {
    res.json(services);
  });

  // GET /api/status
  app.get('/api/status', (req, res) => {
    const healthy = services.filter(s => s.status === 'healthy').length;
    const degraded = services.filter(s => s.status === 'degraded').length;
    const critical = services.filter(s => s.status === 'critical').length;
    const down = services.filter(s => s.status === 'down').length;

    res.json({
      overall: critical > 0 ? 'critical' : degraded > 0 ? 'degraded' : 'healthy',
      healthy,
      degraded,
      critical,
      down,
      total: services.length,
      activeAlerts: 5 // Placeholder based on spec
    });
  });

  // Additional routes (logs, alerts, metrics) would go here following the spec...
  
  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`Mock API running on http://127.0.0.1:${PORT}`);
  });

  return server;
}