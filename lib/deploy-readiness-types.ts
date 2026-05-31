export type DeployReadinessSeverity = 'blocker' | 'warning';

export type DeployReadinessIssue = {
  code: string;
  severity: DeployReadinessSeverity;
  summary: string;
  detail: string;
};
