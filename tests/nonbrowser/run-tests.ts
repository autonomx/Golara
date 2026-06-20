import { runAnalyticsContractTests } from './analytics-contracts.test';
import { runMigrationSchemaTests } from './migration-schema.test';
import { runPropertyNormalizerTests } from './property-normalizers.test';
import { runRepositoryIntegrationTests } from './repository-integration.test';
import { runRouteHandlerContractTests } from './route-handler-contracts.test';
import { runScheduledReportActivationReadinessTests } from './scheduled-report-activation-readiness.test';
import { runScheduledReportDeliveryExecutionTests as runScheduledReportDeliveryRunTests } from './scheduled-report-delivery-execution.test';
import { runScheduledReportDeliveryPayloadTests } from './scheduled-report-delivery-payload.test';
import { runScheduledReportDeliveryReadinessTests } from './scheduled-report-delivery-readiness.test';
import { runScheduledReportDryRunEvidenceTests } from './scheduled-report-dry-run-evidence.test';
import { runScheduledReportDryRunPreviewTests } from './scheduled-report-dry-run-preview.test';
import { runScheduledReportManagementSurfaceTests } from './scheduled-report-management-surface.test';
import { runScheduledReportReadEndpointTests } from './scheduled-report-read-endpoint.test';
import { runScheduledReportRecordingReadinessTests } from './scheduled-report-recording-readiness.test';
import { runScheduledReportRecordingRepositoryTests } from './scheduled-report-recording-repository.test';
import { runScheduledReportRepositoryReadTests } from './scheduled-report-repository-read.test';
import { runScheduledReportRetryPolicyTests } from './scheduled-report-retry-policy.test';
import { runScheduledReportSchedulePlanTests } from './scheduled-report-schedule-plan.test';
import { runScheduledReportTransportContractTests } from './scheduled-report-transport-contract.test';
import { runScheduledReportWorkerShellTests } from './scheduled-report-worker-shell.test';
import { runSeededWorkflowTests } from './seeded-workflows.test';
import { runServerActionContractTests } from './server-action-contracts.test';
import { runStaticBoundaryTests } from './static-boundary.test';

async function main() {
  await runMigrationSchemaTests();
  await runRepositoryIntegrationTests();
  runScheduledReportDryRunEvidenceTests();
  await runScheduledReportDryRunPreviewTests();
  await runScheduledReportDeliveryPayloadTests();
  runScheduledReportDeliveryReadinessTests();
  await runScheduledReportActivationReadinessTests();
  await runScheduledReportSchedulePlanTests();
  await runScheduledReportWorkerShellTests();
  await runScheduledReportTransportContractTests();
  await runScheduledReportDeliveryRunTests();
  await runScheduledReportRetryPolicyTests();
  runScheduledReportRecordingReadinessTests();
  await runScheduledReportRecordingRepositoryTests();
  await runScheduledReportRepositoryReadTests();
  await runScheduledReportReadEndpointTests();
  await runScheduledReportManagementSurfaceTests();
  await runServerActionContractTests();
  await runRouteHandlerContractTests();
  await runPropertyNormalizerTests();
  await runAnalyticsContractTests();
  await runSeededWorkflowTests();
  await runStaticBoundaryTests();
  console.log('non-browser confidence tests passed');
}

main().catch((failure) => {
  console.error(failure);
  process.exitCode = 1;
});
