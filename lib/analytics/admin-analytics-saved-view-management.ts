import {
  buildAdminAnalyticsSavedViewReadModelContract,
  type AdminAnalyticsSavedViewReadDto
} from './admin-analytics-saved-view-read-model';
import { buildAdminAnalyticsSavedViewStorageContract } from './admin-analytics-saved-view-storage';

export type AdminAnalyticsSavedViewManagementActionKey =
  | 'create-view'
  | 'update-view'
  | 'remove-view'
  | 'record-owner-approval';

export type AdminAnalyticsSavedViewApprovedPostEndpoint =
  | '/admin/analytics/saved-views/create'
  | '/admin/analytics/saved-views/update'
  | '/admin/analytics/saved-views/remove'
  | '/admin/analytics/saved-views/record-owner-approval';

export type AdminAnalyticsSavedViewManagementControl = {
  key: AdminAnalyticsSavedViewManagementActionKey;
  label: string;
  description: string;
  actionPath: AdminAnalyticsSavedViewApprovedPostEndpoint;
  method: 'post';
  visibleTo: 'owner' | 'staff';
  enabled: boolean;
  reason: string;
};

export type AdminAnalyticsSavedViewManagementPreview = {
  enabled: boolean;
  isOwner: boolean;
  isStaff: boolean;
  managementUiEnabled: true;
  repositoryReadsEnabled: boolean;
  repositoryWritesEnabled: boolean;
  readEndpointEnabled: boolean;
  writeEndpointsEnabled: boolean;
  ownerApprovalRequired: boolean;
  rolePolicyEnforced: boolean;
  metadataOnly: boolean;
  rows: AdminAnalyticsSavedViewReadDto[];
  controls: AdminAnalyticsSavedViewManagementControl[];
  approvedPostEndpoints: AdminAnalyticsSavedViewApprovedPostEndpoint[];
  blockedFields: string[];
  blockers: string[];
};

export const ADMIN_ANALYTICS_SAVED_VIEW_APPROVED_POST_ENDPOINTS: AdminAnalyticsSavedViewApprovedPostEndpoint[] = [
  '/admin/analytics/saved-views/create',
  '/admin/analytics/saved-views/update',
  '/admin/analytics/saved-views/remove',
  '/admin/analytics/saved-views/record-owner-approval'
];

function control(
  key: AdminAnalyticsSavedViewManagementActionKey,
  label: string,
  description: string,
  actionPath: AdminAnalyticsSavedViewApprovedPostEndpoint,
  visibleTo: 'owner' | 'staff',
  enabled: boolean,
  reason: string
): AdminAnalyticsSavedViewManagementControl {
  return {
    key,
    label,
    description,
    actionPath,
    method: 'post',
    visibleTo,
    enabled,
    reason
  };
}

export function buildAdminAnalyticsSavedViewManagementPreview(options: {
  isOwner: boolean;
  rows?: AdminAnalyticsSavedViewReadDto[];
  repositoryReadsEnabled?: boolean;
  repositoryWritesEnabled?: boolean;
  readEndpointEnabled?: boolean;
  writeEndpointsEnabled?: boolean;
  rolePolicyEnforced?: boolean;
}): AdminAnalyticsSavedViewManagementPreview {
  const storage = buildAdminAnalyticsSavedViewStorageContract();
  const readModel = buildAdminAnalyticsSavedViewReadModelContract();
  const isOwner = options.isOwner === true;
  const repositoryReadsEnabled = options.repositoryReadsEnabled === true;
  const repositoryWritesEnabled = options.repositoryWritesEnabled === true;
  const readEndpointEnabled = options.readEndpointEnabled === true;
  const writeEndpointsEnabled = options.writeEndpointsEnabled === true;
  const rolePolicyEnforced = options.rolePolicyEnforced === true;
  const ownerWritesEnabled = isOwner && repositoryWritesEnabled && writeEndpointsEnabled && rolePolicyEnforced;
  const blockers: string[] = [];

  if (!isOwner) blockers.push('owner session required for saved-view changes');
  if (!repositoryReadsEnabled) blockers.push('saved-view repository reads not enabled');
  if (!repositoryWritesEnabled) blockers.push('saved-view repository writes not enabled');
  if (!readEndpointEnabled) blockers.push('saved-view read endpoint not enabled');
  if (!writeEndpointsEnabled) blockers.push('saved-view write endpoints not enabled');
  if (!rolePolicyEnforced) blockers.push('saved-view role policy not enforced');

  const rows = (options.rows ?? []).filter((row) => row.activeForOperators === false).slice(0, 12);

  return {
    enabled: isOwner || rows.length > 0,
    isOwner,
    isStaff: !isOwner,
    managementUiEnabled: true,
    repositoryReadsEnabled,
    repositoryWritesEnabled,
    readEndpointEnabled,
    writeEndpointsEnabled,
    ownerApprovalRequired: storage.ownerApprovalRequired,
    rolePolicyEnforced,
    metadataOnly: readModel.returnsMetadataOnly,
    rows,
    controls: [
      control(
        'create-view',
        'Save current dashboard view',
        'Persist the selected range and approved section anchors as metadata only.',
        '/admin/analytics/saved-views/create',
        'owner',
        ownerWritesEnabled,
        ownerWritesEnabled ? 'Owner write gates are enabled.' : 'Locked until owner write gates and role policy are enabled.'
      ),
      control(
        'update-view',
        'Update saved dashboard view',
        'Change label, description, range metadata, or section anchors for an approved saved view.',
        '/admin/analytics/saved-views/update',
        'owner',
        ownerWritesEnabled,
        ownerWritesEnabled ? 'Owner write gates are enabled.' : 'Locked until owner write gates and role policy are enabled.'
      ),
      control(
        'remove-view',
        'Remove saved dashboard view',
        'Deactivate or remove metadata for a saved view without deleting analytics rows.',
        '/admin/analytics/saved-views/remove',
        'owner',
        ownerWritesEnabled,
        ownerWritesEnabled ? 'Owner write gates are enabled.' : 'Locked until owner write gates and role policy are enabled.'
      ),
      control(
        'record-owner-approval',
        'Record owner approval',
        'Record approval evidence before any saved view becomes available to operators.',
        '/admin/analytics/saved-views/record-owner-approval',
        'owner',
        ownerWritesEnabled,
        ownerWritesEnabled ? 'Owner approval recording is available.' : 'Locked until owner write gates and role policy are enabled.'
      )
    ],
    approvedPostEndpoints: [...ADMIN_ANALYTICS_SAVED_VIEW_APPROVED_POST_ENDPOINTS],
    blockedFields: [...storage.blockedPayloadFields, ...readModel.blockedOutputFields],
    blockers
  };
}
