import express, { Request, Response } from "express";
import * as mock from "./mock-data";
import cors from 'cors'

const app = express();
app.use(cors()) 
app.use(express.json());

// Root health check
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "DevOps Monitor API is running" });
});

// services
app.get("/api/services", (req: Request, res: Response) => {
  const period = parseInt((req.query.period as string) || "0", 10);
  res.json(mock.getServices(isNaN(period) ? undefined : period));
});

app.get("/api/services/:id", (req, res) => {
  const svc = mock.getService(req.params.id);
  if (!svc) return res.status(404).send({ error: "not found" });
  res.json(svc);
});

app.get("/api/services/:id/metrics", (req, res) => {
  const range = parseInt((req.query.range as string) || "0", 10);
  res.json(mock.getMetrics(req.params.id, isNaN(range) ? undefined : range));
});

app.get("/api/services/:id/logs", (req, res) => {
  const { level, search, page, limit } = req.query;
  const { items, total, page: p, limit: l } = mock.queryLogs({
    serviceId: req.params.id,
    level: level as string | undefined,
    search: search as string | undefined,
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined
  });
  res.json({ items, total, page: p, limit: l });
});

app.post("/api/services/:id/restart", async (req, res) => {
  try {
    await mock.restartService(req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(404).send({ error: e.message });
  }
});

app.post("/api/services/:id/drain", async (req, res) => {
  try {
    await mock.drainService(req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(404).send({ error: e.message });
  }
});

// alerts
app.get("/api/alerts", (req, res) => {
  const { severity, status, page, limit, timeRange } = req.query;
  const { items, total, page: p, limit: l } = mock.queryAlerts({
    severity: severity as string | undefined,
    status: status as string | undefined,
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    timeRange: timeRange ? parseInt(timeRange as string, 10) : undefined
  });
  res.json({ items, total, page: p, limit: l });
});

app.get("/api/alerts/active-count", (_req, res) => {
  res.json({ count: mock.getActiveAlertCount() });
});

app.post("/api/alerts/:id/acknowledge", (req, res) => {
  const a = mock.acknowledgeAlert(req.params.id);
  if (!a) return res.status(404).send({ error: "not found" });
  res.json(a);
});

// global logs
app.get("/api/logs", (req, res) => {
  const { level, service, search, page, limit, timeRange } = req.query;
  const { items, total, page: p, limit: l } = mock.queryLogs({
    serviceId: service as string | undefined,
    level: level as string | undefined,
    search: search as string | undefined,
    page: page ? parseInt(page as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    timeRange: timeRange ? parseInt(timeRange as string, 10) : undefined
  });
  res.json({ items, total, page: p, limit: l });
});

// status
app.get("/api/status", (_req, res) => {
  res.json(mock.getStatus());
});

// alert settings
app.get("/api/services/:id/alert-settings", (req, res) => {
  const settings = mock.getAlertSettings(req.params.id);
  if (!settings) return res.status(404).send({ error: "not found" });
  res.json(settings);
});

app.put("/api/services/:id/alert-settings", (req, res) => {
  const settings = mock.updateAlertSettings(req.params.id, req.body);
  res.json(settings);
});

// start helper
export function startMockServer(port = 3001) {
  mock.initMockData();
  mock.startTicker();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Mock server listening on http://127.0.0.1:${port}`)
  })
}
