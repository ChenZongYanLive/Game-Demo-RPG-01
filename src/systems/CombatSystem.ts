/**
 * CombatSystem — pure, framework-free combat math and shared interfaces.
 *
 * Kept free of Phaser imports so it can be unit-tested under Node with
 * Vitest. Entities (Player, Enemy) depend on this module, not the other
 * way around, to avoid circular imports.
 */

/** Baseline stats needed to resolve a single hit. */
export interface CombatStats {
  attack: number;
  defense: number;
}

/**
 * Computes the damage dealt by `attacker` to `defender` for a single hit.
 * - Minimum damage is always 1 so nothing ever feels completely ineffective.
 * - Defense reduces damage at half rate so stacking defense is worthwhile
 *   but never trivializes combat.
 */
export function calcDamage(attackerAttack: number, defenderDefense: number): number {
  if (!Number.isFinite(attackerAttack) || !Number.isFinite(defenderDefense)) {
    return 1;
  }
  const raw = attackerAttack - Math.floor(defenderDefense / 2);
  return Math.max(1, Math.floor(raw));
}

/**
 * Anything that can receive damage. Used by Player's attack hitbox to
 * damage entities without importing Enemy (or vice versa), which keeps
 * entities decoupled from one another.
 */
export interface Damageable {
  takeDamage(amount: number, fromX?: number, fromY?: number): void;
}

/** Runtime guard for the Damageable interface. */
export function isDamageable(obj: unknown): obj is Damageable {
  if (obj === null || typeof obj !== 'object') return false;
  const candidate = obj as { takeDamage?: unknown };
  return typeof candidate.takeDamage === 'function';
}
