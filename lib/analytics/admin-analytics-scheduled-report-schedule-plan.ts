export type AdminAnalyticsScheduledReportScheduleCadence = 'weekly' | 'monthly';

export function scheduledReportSchedulePlanStatus() {
  return {
    status: 'schedule_plan_disabled_preview' as const,
    schedulerRuntimeEnabled: false,
    timerRegistrationEnabled: false,
    backgroundJobRegistrationEnabled: false,
    deliveryExecutionEnabled: false
  };
}
