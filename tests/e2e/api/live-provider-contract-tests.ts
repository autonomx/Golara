import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { pathToFileURL } from 'node:url';

function optionalEnv(name: string) {
  return process.env[name]?.trim() || '';
}

async function postJson(url: string, rawBody: string, headers: Record<string, string>) {
  return fetch(url, {
    method: 'POST',
    body: rawBody,
    headers: {
      'content-type': 'application/json',
      ...headers
    }
  });
}

async function runLiveStripeWebhookContractIfConfigured() {
  const url = optionalEnv('LIVE_STRIPE_WEBHOOK_URL');
  const secret = optionalEnv('LIVE_STRIPE_WEBHOOK_SECRET');
  if (!url || !secret) return 'skipped';

  const payload = {
    id: `evt_golara_live_contract_${Date.now()}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_golara_live_contract_${Date.now()}`,
        metadata: { orderNumber: 'GOLARA-LIVE-CONTRACT-NO-MATCH' }
      }
    }
  };
  const rawBody = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const response = await postJson(url, rawBody, { 'stripe-signature': `t=${timestamp},v1=${signature}` });
  assert.equal([200, 202].includes(response.status), true, `Stripe live contract status ${response.status}`);
  return 'ran';
}

async function runLiveZarinpalWebhookContractIfConfigured() {
  const url = optionalEnv('LIVE_ZARINPAL_WEBHOOK_URL');
  const secret = optionalEnv('LIVE_ZARINPAL_WEBHOOK_SECRET');
  if (!url || !secret) return 'skipped';

  const rawBody = JSON.stringify({
    authority: `A${Date.now()}golaraLiveContract`,
    status: 'OK',
    amount: 125000,
    refId: `golara-live-contract-${Date.now()}`
  });
  const signature = createHmac('sha256', secret).update(rawBody).digest('hex');
  const response = await postJson(url, rawBody, { 'x-zarinpal-signature': signature });
  assert.equal([200, 202].includes(response.status), true, `Zarinpal live contract status ${response.status}`);
  return 'ran';
}

export async function runLiveProviderContractTests() {
  const stripe = await runLiveStripeWebhookContractIfConfigured();
  const zarinpal = await runLiveZarinpalWebhookContractIfConfigured();
  console.log(`live provider webhook contracts: stripe=${stripe}, zarinpal=${zarinpal}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runLiveProviderContractTests().catch((error) => {
    console.error(error);
    throw error;
  });
}
