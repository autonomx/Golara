import {
  buildAdminAnalyticsSavedViewChangePlan,
  type AdminAnalyticsSavedViewAdapterGateState,
  type AdminAnalyticsSavedViewChangePlan
} from './admin-analytics-saved-view-adapter-plan';
import type {
  AdminAnalyticsSavedViewMutationData,
  AdminAnalyticsSavedViewMutationInput
} from './admin-analytics-saved-view-mutation-policy';

export type AdminAnalyticsSavedViewStoredRow = {
  id?: string;
  viewKey: string;
  label: string;
  description: string | null;
  scope: string;
  audience: string;
  rangeMode: string;
  rangeQuery: string;
  sectionAnchors: unknown;
  ownerApproved: boolean;
  isActive: boolean;
  createdByRole: string;
  createdByLabel: string | null;
  metadata: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

export type AdminAnalyticsSavedViewWhereUnique = {
  viewKey_scope: {
    viewKey: string;
    scope: string;
  };
};

export type AdminAnalyticsSavedViewStorageData = {
  viewKey: string;
  label: string;
  description: string | null;
  scope: string;
  audience: string;
  rangeMode: string;
  rangeQuery: string;
  sectionAnchors: string[];
  ownerApproved: boolean;
  isActive: boolean;
  createdByRole: 'owner';
  createdByLabel: string | null;
  metadata: AdminAnalyticsSavedViewMutationData['metadata'] & {
    appliedBy: 'saved-view-owner-action';
  };
};

export type AdminAnalyticsSavedViewStorageDelegate = {
  upsert: (args: {
    where: AdminAnalyticsSavedViewWhereUnique;
    create: AdminAnalyticsSavedViewStorageData;
    update: Partial<AdminAnalyticsSavedViewStorageData>;
  }) => Promise<AdminAnalyticsSavedViewStoredRow>;
  update: (args: {
    where: AdminAnalyticsSavedViewWhereUnique;
    data: Partial<AdminAnalyticsSavedViewStorageData>;
  }) => Promise<AdminAnalyticsSavedViewStoredRow>;
};

export type AdminAnalyticsSavedViewStorageApplyResult = {
  accepted: boolean;
  stored: boolean;
  metadataOnly: true;
  operation: AdminAnalyticsSavedViewChangePlan['operation'];
  blockers: string[];
  where: AdminAnalyticsSavedViewWhereUnique | null;
  row: AdminAnalyticsSavedViewStoredRow | null;
};

function storageDataFromPlan(data: AdminAnalyticsSavedViewMutationData): AdminAnalyticsSavedViewStorageData {
  return {
    viewKey: data.viewKey,
    label: data.label,
    description: data.description,
    scope: data.scope,
    audience: data.audience,
    rangeMode: data.rangeMode,
    rangeQuery: data.rangeQuery,
    sectionAnchors: [...data.sectionAnchors],
    ownerApproved: data.ownerApproved,
    isActive: data.isActive,
    createdByRole: 'owner',
    createdByLabel: data.createdByLabel,
    metadata: {
      ...data.metadata,
      appliedBy: 'saved-view-owner-action'
    }
  };
}

function approvalData(data: AdminAnalyticsSavedViewMutationData): Partial<AdminAnalyticsSavedViewStorageData> {
  return {
    ownerApproved: true,
    isActive: true,
    metadata: {
      ...data.metadata,
      appliedBy: 'saved-view-owner-action'
    }
  };
}

export async function applyAdminAnalyticsSavedViewStorage(options: {
  input: AdminAnalyticsSavedViewMutationInput;
  gateState?: Partial<AdminAnalyticsSavedViewAdapterGateState>;
  delegate: AdminAnalyticsSavedViewStorageDelegate | null;
}): Promise<AdminAnalyticsSavedViewStorageApplyResult> {
  const changePlan = buildAdminAnalyticsSavedViewChangePlan({ input: options.input, gateState: options.gateState });
  const blockers = [...changePlan.blockers];

  if (options.delegate === null) blockers.push('saved-view storage delegate not provided');
  if (!changePlan.accepted || changePlan.data === null || changePlan.where === null || options.delegate === null) {
    return {
      accepted: false,
      stored: false,
      metadataOnly: true,
      operation: 'none',
      blockers,
      where: changePlan.where ? { viewKey_scope: changePlan.where } : null,
      row: null
    };
  }

  const where = { viewKey_scope: changePlan.where };
  const data = storageDataFromPlan(changePlan.data);
  let row: AdminAnalyticsSavedViewStoredRow;

  if (changePlan.operation === 'create' || changePlan.operation === 'update') {
    row = await options.delegate.upsert({
      where,
      create: {
        ...data,
        ownerApproved: false,
        isActive: false
      },
      update: {
        label: data.label,
        description: data.description,
        audience: data.audience,
        rangeMode: data.rangeMode,
        rangeQuery: data.rangeQuery,
        sectionAnchors: data.sectionAnchors,
        ownerApproved: false,
        isActive: false,
        metadata: data.metadata
      }
    });
  } else if (changePlan.operation === 'record-owner-approval') {
    row = await options.delegate.update({ where, data: approvalData(changePlan.data) });
  } else if (changePlan.operation === 'deactivate') {
    row = await options.delegate.update({
      where,
      data: {
        isActive: false,
        metadata: data.metadata
      }
    });
  } else {
    return {
      accepted: false,
      stored: false,
      metadataOnly: true,
      operation: 'none',
      blockers: ['unsupported saved-view storage operation'],
      where,
      row: null
    };
  }

  return {
    accepted: true,
    stored: true,
    metadataOnly: true,
    operation: changePlan.operation,
    blockers: [],
    where,
    row
  };
}
