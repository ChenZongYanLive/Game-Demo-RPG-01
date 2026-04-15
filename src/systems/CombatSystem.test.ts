import { describe, expect, it } from 'vitest';
import { calcDamage, isDamageable } from './CombatSystem';

describe('calcDamage', () => {
  it('applies attacker attack minus half defender defense', () => {
    expect(calcDamage(10, 4)).toBe(10 - 2);
    expect(calcDamage(20, 6)).toBe(20 - 3);
  });

  it('floors fractional defense reduction', () => {
    // Defense 5 → floor(5/2) = 2
    expect(calcDamage(10, 5)).toBe(8);
  });

  it('never deals less than 1 damage even when defense exceeds attack', () => {
    expect(calcDamage(1, 100)).toBe(1);
    expect(calcDamage(0, 0)).toBe(1);
  });

  it('returns 1 when inputs are non-finite', () => {
    expect(calcDamage(Number.NaN, 5)).toBe(1);
    expect(calcDamage(10, Number.POSITIVE_INFINITY)).toBe(1);
  });

  it('handles zero defense cleanly', () => {
    expect(calcDamage(7, 0)).toBe(7);
  });
});

describe('isDamageable', () => {
  it('returns true for objects with a takeDamage function', () => {
    expect(isDamageable({ takeDamage: () => void 0 })).toBe(true);
  });

  it('returns false for null, primitives, and objects without takeDamage', () => {
    expect(isDamageable(null)).toBe(false);
    expect(isDamageable(undefined)).toBe(false);
    expect(isDamageable(42)).toBe(false);
    expect(isDamageable('hit')).toBe(false);
    expect(isDamageable({})).toBe(false);
    expect(isDamageable({ takeDamage: 'not-a-fn' })).toBe(false);
  });
});
