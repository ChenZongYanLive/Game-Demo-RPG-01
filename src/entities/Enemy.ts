import Phaser from 'phaser';
import { calcDamage, type CombatStats, type Damageable } from '../systems/CombatSystem';

const ENEMY_SPEED = 70;
const AGGRO_RADIUS = 220;
const ATTACK_RANGE = 26;
const ATTACK_COOLDOWN_MS = 900;
const KNOCKBACK_SPEED = 180;
const KNOCKBACK_DURATION_MS = 150;
const DEFAULT_STATS: CombatStats = { attack: 6, defense: 2 };
const DEFAULT_MAX_HP = 12;

/**
 * Basic melee enemy. Chases the player within AGGRO_RADIUS and deals
 * contact damage on touch with a per-enemy cooldown. Takes knockback
 * when hit, then recovers.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite implements Damageable {
  private readonly target: Phaser.GameObjects.GameObject & { x: number; y: number };
  private readonly stats: CombatStats;
  private maxHp: number;
  private hp: number;
  private knockbackUntil = 0;
  private nextAttackAt = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    target: Phaser.GameObjects.GameObject & { x: number; y: number },
    stats: CombatStats = DEFAULT_STATS,
    maxHp: number = DEFAULT_MAX_HP,
  ) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.target = target;
    this.stats = stats;
    this.maxHp = maxHp;
    this.hp = maxHp;

    this.setCollideWorldBounds(true);
    this.setCircle(9, 3, 3);
    this.setDepth(9);
  }

  override update(time: number, _delta: number): void {
    if (!this.active) return;

    // During knockback window, don't drive velocity — let momentum play out.
    if (time < this.knockbackUntil) {
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    if (dist > AGGRO_RADIUS || dist < 1) {
      this.setVelocity(0, 0);
      return;
    }

    this.scene.physics.moveToObject(this, this.target, ENEMY_SPEED);
  }

  /** Called by WorldScene's overlap callback when enemy touches player. */
  tryHitPlayer(victim: Damageable, time: number): void {
    if (!this.active) return;
    if (time < this.nextAttackAt) return;
    const dist = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.target.x,
      this.target.y,
    );
    if (dist > ATTACK_RANGE) return;

    victim.takeDamage(this.stats.attack, this.x, this.y);
    this.nextAttackAt = time + ATTACK_COOLDOWN_MS;
  }

  takeDamage(amount: number, fromX?: number, fromY?: number): void {
    if (!this.active) return;

    const damage = calcDamage(amount, this.stats.defense);
    this.hp -= damage;

    // Knockback away from the hit source.
    if (fromX !== undefined && fromY !== undefined) {
      const angle = Phaser.Math.Angle.Between(fromX, fromY, this.x, this.y);
      this.setVelocity(Math.cos(angle) * KNOCKBACK_SPEED, Math.sin(angle) * KNOCKBACK_SPEED);
      this.knockbackUntil = this.scene.time.now + KNOCKBACK_DURATION_MS;
    }

    // Flash red on hit.
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => this.clearTint());

    if (this.hp <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.enable = false;
    }
    this.scene.events.emit('enemy-killed', this);
  }

  get currentHp(): number {
    return this.hp;
  }

  get maxHealth(): number {
    return this.maxHp;
  }
}
