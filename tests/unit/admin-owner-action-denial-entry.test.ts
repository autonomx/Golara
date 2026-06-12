import { runAdminOwnerActionDenialTests } from './admin-owner-action-denial.test';

runAdminOwnerActionDenialTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
