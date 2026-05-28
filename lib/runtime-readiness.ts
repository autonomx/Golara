import { canUseSeedFallback, getAppRuntimeMode, type AppRuntimeMode } from '@/lib/runtime-mode';

export type RuntimeReadiness = {
  appMode: AppRuntimeMode;
  nodeEnv: string;
  vercelEnv: string;
  databaseUrlPresent: boolean;
  seedFallbackAllowed: boolean;
  productionSafe: boolean;
};

function displayEnvValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || 'not set';
}

export function getRuntimeReadiness(): RuntimeReadiness {
  const appMode = getAppRuntimeMode();
  const databaseUrlPresent = Boolean(process.env.DATABASE_URL?.trim());
  const seedFallbackAllowed = canUseSeedFallback();

  return {
    appMode,
    nodeEnv: displayEnvValue(process.env.NODE_ENV),
    vercelEnv: displayEnvValue(process.env.VERCEL_ENV),
    databaseUrlPresent,
    seedFallbackAllowed,
    productionSafe: appMode !== 'production' || databaseUrlPresent
  };
}
