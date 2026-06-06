import { p37Review } from './p37-review';

export type P37Chain = {
  p: 37;
  step: 'chain';
  ready: true;
  count: number;
  enabled: false;
};

export function p37Chain(): P37Chain {
  const review = p37Review();

  return {
    p: 37,
    step: 'chain',
    ready: review.r,
    count: review.c,
    enabled: review.e
  };
}
