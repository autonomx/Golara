import { runAnalyticsContractTests } from './analytics-contracts.test';
import { runMigrationSchemaTests } from './migration-schema.test';
import { runPropertyNormalizerTests } from './property-normalizers.test';
import { runRepositoryIntegrationTests } from './repository-integration.test';
import { runRouteHandlerContractTests } from './route-handler-contracts.test';
import { runScheduledReportDeliveryReadinessTests } from './scheduled-report-delivery-readiness.test';
import { runScheduledReportDryRunEvidenceTests } from './scheduled-report-dry-run-evidence.test';
import { runScheduledReportRecordingReadinessTests } from './scheduled-report-recording-readiness.test';
import { runScheduledReportRecordingRepositoryTests } from './scheduled-report-recording-repository.test';
import { runScheduledReportRepositoryReadTests } from './scheduled-report-repository-read.test';
import { runSeededWorkflowTests } from './seeded-workflows.test';
import { runServerActionContractTests } from './server-action-contracts.test';
import { runStaticBoundaryTests } from './static-boundary.test';

async function main() {
  await runMigrationSchemaTests();
  await runRepositoryIntegrationTests();
  runScheduledReportDryRunEvidenceTests();
  runScheduledReportDeliveryReadinessTests();
  runScheduledReportRecordingReadinessTests();
  await runScheduledReportRecordingRepositoryTests();
  await runScheduledReportRepositoryReadTests();
  await runServerActionContractTests();
  await runRouteHandlerContractTests();
  await runPropertyNormalizerTests();
  await runAnalyticsContractTests();
  await runSeededWorkflowTests();
  await runStaticBoundaryTests();
  console.log('non-browser confidence tests passed');
}

main().catch((error) => {
  console.error(error);
  throw error;
});