import { faker } from '@faker-js/faker';

export const SERVICES_LIST = [
  'api-gateway', 'auth-service', 'payment-processor', 'user-service',
  'notification-service', 'cache-service', 'db-postgres', 'db-redis',
  'queue-worker', 'file-storage', 'metrics-collector', 'load-balancer'
];

export const generateService = (id: string, name: string) => ({
  id,
  name,
  status: faker.helpers.arrayElement(['healthy', 'degraded', 'critical', 'down']),
  uptime: faker.number.int({ min: 1000, max: 1000000 }),
  cpu: faker.number.int({ min: 5, max: 95 }),
  ram: faker.number.int({ min: 20, max: 90 }),
  disk: faker.number.int({ min: 10, max: 80 }),
  iops: faker.number.int({ min: 100, max: 5000 }),
  ip: faker.internet.ipv4(),
  port: faker.internet.port(),
  version: `v${faker.system.semver()}`
});

export const generateMetricPoint = (timestamp: Date) => ({
  timestamp: timestamp.toISOString(),
  cpu: faker.number.int({ min: 10, max: 90 }),
  ram: faker.number.int({ min: 20, max: 80 }),
  disk: faker.number.int({ min: 30, max: 70 }),
  iops: faker.number.int({ min: 200, max: 3000 })
});

export const generateLog = (serviceId: string, serviceName: string) => ({
  id: faker.string.uuid(),
  serviceId,
  serviceName,
  level: faker.helpers.weightedArrayElement([
    { weight: 60, value: 'INFO' },
    { weight: 30, value: 'WARN' },
    { weight: 10, value: 'ERROR' }
  ]),
  message: faker.lorem.sentence(),
  timestamp: faker.date.recent().toISOString()
});

export const generateAlert = (serviceId: string, serviceName: string) => ({
  id: faker.string.uuid(),
  serviceId,
  serviceName,
  severity: faker.helpers.arrayElement(['critical', 'warning', 'info']),
  message: faker.hacker.phrase(),
  timestamp: faker.date.recent().toISOString(),
  status: faker.helpers.weightedArrayElement([
    { weight: 60, value: 'active' },
    { weight: 40, value: 'acknowledged' }
  ])
});