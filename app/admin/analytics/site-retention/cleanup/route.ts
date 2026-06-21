import { NextResponse } from 'next/server';

import { assertAdminRole } from '@/lib/admin-auth';
import { buildSiteAnalyticsRetentionCleanupDelegate } from '@/lib/analytics/site-analytics-retention-cleanup-delegate';
import { buildSiteAnalyticsRetentionCleanupPlan } from '@/lib/analytics/site-analytics-retention-cleanup-plan';
import { executeSiteAnalyticsRetentionCleanup } from '@/lib/analytics/site-analytics-retention-cleanup-executor';
import { siteAnalyticsRetentionService } from '@/lib/analytics/site-analytics-retention';

export const dynamic = 'force-dynamic';

const PLAN_FLAG = 'SITE_ANALYTICS_RETENTION_CLEANUP_PLAN_ENABLED';
const EXECUTION_FLAG = 'SITE_ANALYTICS_RETENTION_CLEANUP_EXECUTION_ENABLED';
const MANUAL_CONFIRM_FIELD = 'manualOwnerConfirmation';

function flagEnabled(name: string) {
  const value = process.env[name]?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function manualConfirmation(form: FormData) {
  const value = String(form.get(MANUAL_CONFIRM_FIELD) ?? '').trim().toLowerCase();
  return value === 'confirm-retention-cleanup';
}

export async function POST(request: Request) {
  try {
    await assertAdminRole('owner');
    const form = await request.formData();
    const summary = await siteAnalyticsRetentionService.summary();
    const plan = buildSiteAnalyticsRetentionCleanupPlan({
      actorRole: 'owner',
      summary,
      deletionPlanEnabled: flagEnabled(PLAN_FLAG),
      maxDeletionBatchSize: 1000
    });
    const delegateAttachment = buildSiteAnalyticsRetentionCleanupDelegate({
      databaseConfigured: summary.databaseConfigured && summary.tableAvailable
    });
    const execution = await executeSiteAnalyticsRetentionCleanup({
      plan,
      delegate: delegateAttachment.delegate,
      executionEnabled: flagEnabled(EXECUTION_FLAG),
      manualTriggerConfirmed: manualConfirmation(form)
    });

    return NextResponse.json(
      {
        ok: execution.accepted,
        plan,
        execution,
        delegate: delegateAttachment.state,
        route: {
          ownerOnly: true,
          manualConfirmationField: MANUAL_CONFIRM_FIELD,
          delegateAttached: delegateAttachment.state.attached,
          backgroundJobStarted: false
        }
      },
      { status: execution.accepted ? 202 : 409 }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Owner admin session required for retention cleanup.' }, { status: 403 });
  }
}
