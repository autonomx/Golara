import { p37State } from './p37-state';

export type P37Review = {
  p: 37;
  r: true;
  c: number;
  e: false;
};

export function p37Review(): P37Review {
  const state = p37State();

  return {
    p: 37,
    r: state.ready,
    c: state.count,
    e: state.enabled
  };
}
