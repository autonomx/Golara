import {
  buildAdminAnalyticsSavedViewStorageContract,
  type AdminAnalyticsSavedViewStorageAudience,
  type AdminAnalyticsSavedViewStorageScope
} from './admin-analytics-saved-view-storage';
import {
  ADMIN_ANALYTICS_SAVED_VIEW_APPROVED_POST_ENDPOINTS,
  type AdminAnalyticsSavedViewApprovedPostEndpoint,
  type AdminAnalyticsSavedViewManagementActionKey
} from './admin-analytics-saved-view-management';

export type AdminAnalyticsSavedViewActorRole = 'owner' | 'staff' | 'public';

export type AdminAnalyticsSavedViewMutationInput = {
  action: AdminAnalyticsSavedViewManagementActionKey;
  actorRole: AdminAnalyticsSavedViewActorRole;
  actionPath: string;
  viewKey?: unknown;
  label?: unknown;
  description?: unknown;
  scope?: unknown;
  audience?: unknown;
  rangeMode?: unknown;
  rangeQuery?: unknown;
  sectionAnchors?: unknown;
  ownerApprovalNote?: unknown;
  requestedByLabel?: unknown;
  repositoryWritesEnabled?: boolean;
  writeEndpointsEnabled?: boolean;
  rolePolicyEnforced?: boolean;
  ownerApprovalRequired?: boolean;
};

export type AdminAnalyticsSavedViewMutationData = {
  viewKey: string;
  label: string;
  description: string | null;
  scope: AdminAnalyticsSavedViewStorageScope;
  audience: AdminAnalyticsSavedViewStorageAudience;
  rangeMode: string;
  rangeQuery: string;
  sectionAnchors: string[];
  ownerApproved: boolean;
  isActive: false;
  createdByRole: 'owner';
  createdByLabel: string | null;
  metadata: {
    action: AdminAnalyticsSavedViewManagementActionKey;
    ownerApprovalNote?: string;
  };
};

export type AdminAnalyticsSavedViewMutationPlan = {
  accepted: boolean;
  action: AdminAnalyticsSavedViewManagementActionKey;
  actionPath: AdminAnalyticsSavedViewApprovedPostEndpoint | null;
  actorRole: AdminAnalyticsSavedViewActorRole;
  repositoryWritesEnabled: boolean;
  writeEndpointsEnabled: boolean;
  rolePolicyEnforced: boolean;
  metadataOnly: true;
  blockedFields: string[];
  blockers: string[];
  data: AdminAnalyticsSavedViewMutationData | null;
  repositoryOperation: 'none' | 'create' | 'update' | 'deactivate' | 'record-owner-approval';
};

const ACTION_OPERATION: Record<AdminAnalyticsSavedViewManagementActionKey, AdminAnalyticsSavedViewMutationPlan['repositoryOperation']> = {
  'create-view': 'create',
  'update-view': 'update',
  'remove-view': 'deactivate',
  'record-owner-approval': 'record-owner-approval'
};

function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  if (cleaned.length === 0 || cleaned.length > maxLength) return null;
  return cleaned;
}

function optionalString(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined || value === '') return null;
  return cleanString(value, maxLength);
}

function cleanAnchors(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((entry) => cleanString(entry, 80))
        .filter((entry): entry is string => entry !== null)
        .filter((entry) => entry.startsWith('#'))
    )
  ).slice(0, 24);
}

function allowedScope(value: unknown): value is AdminAnalyticsSavedViewStorageScope {
  if (typeof value !== 'string') return false;
  return buildAdminAnalyticsSavedViewStorageContract().allowedScopes.includes(value as AdminAnalyticsSavedViewStorageScope);
}

function allowedAudience(value: unknown): value is AdminAnalyticsSavedViewStorageAudience {
  if (typeof value !== 'string') return false;
  return buildAdminAnalyticsSavedViewStorageContract().allowedAudiences.includes(value as AdminAnalyticsSavedViewStorageAudience);
}

function approvedPath(value: string): AdminAnalyticsSavedViewApprovedPostEndpoint | null {
  return ADMIN_ANALYTICS_SAVED_VIEW_APPROVED_POST_ENDPOINTS.includes(value as AdminAnalyticsSavedViewApprovedPostEndpoint)
    ? (value as AdminAnalyticsSavedViewApprovedPostEndpoint)
    : null;
}

export function buildAdminAnalyticsSavedViewMutationPlan(
  input: AdminAnalyticsSavedViewMutationInput
): AdminAnalyticsSavedViewMutationPlan {
  const storage = buildAdminAnalyticsSavedViewStorageContract();
  const blockers: string[] = [];
  const actionPath = approvedPath(input.actionPath);
  const repositoryWritesEnabled = input.repositoryWritesEnabled === true;
  const writeEndpointsEnabled = input.writeEndpointsEnabled === true;
  const rolePolicyEnforced = input.rolePolicyEnforced === true;
  const ownerApprovalRequired = input.ownerApprovalRequired !== false;
  const viewKey = cleanString(input.viewKey, 80);
  const label = cleanString(input.label, 120);
  const description = optionalString(input.description, 280);
  const rangeMode = cleanString(input.rangeMode, 40);
  const rangeQuery = cleanString(input.rangeQuery, 240);
  const requestedByLabel = optionalString(input.requestedByLabel, 120);
  const ownerApprovalNote = optionalString(input.ownerApprovalNote, 280);
  const sectionAnchors = cleanAnchors(input.sectionAnchors);

  if (input.actorRole !== 'owner') blockers.push('owner role required for saved-view mutations');
  if (!actionPath) blockers.push('approved saved-view action target required');
  if (!repositoryWritesEnabled) blockers.push('saved-view repository writes are disabled');
  if (!writeEndpointsEnabled) blockers.push('saved-view write endpoints are disabled');
  if (!rolePolicyEnforced) blockers.push('saved-view role policy is not enforced');
  if (!viewKey) blockers.push('valid saved-view key required');
  if (!label && input.action !== 'remove-view') blockers.push('valid saved-view label required');
  if (!allowedScope(input.scope)) blockers.push('approved saved-view scope required');
  if (!allowedAudience(input.audience)) blockers.push('approved saved-view audience required');
  if (!rangeMode && input.action !== 'remove-view') blockers.push('valid range mode required');
  if (!rangeQuery && input.action !== 'remove-view') blockers.push('valid range query required');
  if (sectionAnchors.length === 0 && input.action !== 'remove-view') blockers.push('at least one approved section anchor required');
  if (input.action === 'record-owner-approval' && ownerApprovalRequired && !ownerApprovalNote) {
    blockers.push('owner approval evidence note required');
  }

  const accepted = blockers.length === 0;
  const data: AdminAnalyticsSavedViewMutationData | null = accepted
    ? {
        viewKey: viewKey!,
        label: label ?? viewKey!,
        description,
        scope: input.scope as AdminAnalyticsSavedViewStorageScope,
        audience: input.audience as AdminAnalyticsSavedViewStorageAudience,
        rangeMode: rangeMode ?? 'removed',
        rangeQuery: rangeQuery ?? 'removed',
        sectionAnchors,
        ownerApproved: input.action === 'record-owner-approval',
        isActive: false,
        createdByRole: 'owner',
        createdByLabel: requestedByLabel,
        metadata: {
          action: input.action,
          ...(ownerApprovalNote ? { ownerApprovalNote } : {})
        }
      }
    : null;

  return {
    accepted,
    action: input.action,
    actionPath,
    actorRole: input.actorRole,
    repositoryWritesEnabled,
    writeEndpointsEnabled,
    rolePolicyEnforced,
    metadataOnly: true,
    blockedFields: [...storage.blockedPayloadFields],
    blockers,
    data,
    repositoryOperation: accepted ? ACTION_OPERATION[input.action] : 'none'
  };
}
