import { p37Chain } from './p37-chain';

export type P37Summary = {
  p: 37;
  s: 'summary';
  ready: true;
  count: number;
  enabled: false;
};

export function p37Summary(): P37Summary {
  const chain = p37Chain();

  return {
    p: 37,
    s: 'summary',
    ready: chain.ready,
    count: chain.count,
    enabled: chain.enabled
  };
}
