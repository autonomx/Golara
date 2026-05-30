#!/usr/bin/env tsx

import { formatDeployReadinessReport, getDeployReadiness } from '../lib/deploy-readiness';

const report = getDeployReadiness();
const formatted = formatDeployReadinessReport(report);

if (report.ready) {
  console.log(formatted);
  process.exit(0);
}

console.error(formatted);
process.exit(1);
