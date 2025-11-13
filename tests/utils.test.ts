import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('utils: cn', () => {
  it('merges class names and filters falsy values', () => {
    const result = cn('a', false && 'b', null, undefined, 'c');
    expect(result).toBe('a c');
  });
});