export interface RandomSource { next(): number }

export const mathRandomSource: RandomSource = { next: () => Math.random() };

export function sequenceRandomSource(values: readonly number[]): RandomSource {
  let index = 0;
  return {
    next: () => {
      if (index >= values.length) throw new Error('RandomSource sequence exhausted');
      return values[index++];
    },
  };
}
