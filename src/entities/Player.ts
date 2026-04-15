import Phaser from 'phaser';
import { calcDamage, isDamageable, type CombatStats, type Damageable } from '../systems/CombatSystem';

const PLAYER_SPEED = 160;
const DIAGONAL_SPEED = PLAYER_SPEED / Math.SQRT2;

const ATTACK_COOLDOWN_MS = 380;
const INVULN_DURATION_MS = 700;
const KNOCKBACK_SPEED = 200;
const KNOCKBACK_DURATION_MS = 140;

const DEFAULT_STATS: CombatStats = { attack: 8, defense: 3 };
const DEFAULT_MAX_HP = 20;

export type Facing = 'up' | 'down' | 'left' | 'right';

type WasdKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  attack: Phaser.Input.Keyboard.Key;
};

/**
 * Player entity. Movement via WASD / arrows, melee attack via SPACE.
 * Implements Damageable so Enemy.tryHitPlayer can damage it.
 */
export class Player extends Phaser.Physics.Arcade.Sprite implements Damageable {
  readonly maxHp: number = DEFAULT_MAX_HP;
  hp: number = DEFAULT_MAX_HP;
  readonly stats: CombatStats = { ...DEFAULT_STATS };

  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: WasdKeys;
  private facing: Facing = 'down';
  private nextAttackAt = 0;
  private invulnerableUntil = 0;
  private knockbackUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setCircle(11, 1, 1);
    this.setDepth(10);

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input plugin is unavailable; cannot create Player.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      attack: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };
  }

  override update(time: number, _delta: number): void {
    if (!this.active) return;

    // Skip input-driven movement while being knocked back.
    if (time >= this.knockbackUntil) {
      this.handleMovement();
    }
    this.handleAttack(time);
  }

  private handleMovement(): void {
    const leftDown = this.cursors.left?.isDown || this.wasd.left.isDown;
    const rightDown = this.cursors.right?.isDown || this.wasd.right.isDown;
    const upDown = this.cursors.up?.isDown || this.wasd.up.isDown;
    const downDown = this.cursors.down?.isDown || this.wasd.down.isDown;

    let vx = 0;
    let vy = 0;
    if (leftDown) vx -= 1;
    if (rightDown) vx += 1;
    if (upDown) vy -= 1;
    if (downDown) vy += 1;

    if (vx !== 0 && vy !== 0) {
      this.setVelocity(vx * DIAGONAL_SPEED, vy * DIAGONAL_SPEED);
    } else {
      this.setVelocity(vx * PLAYER_SPEED, vy * PLAYER_SPEED);
    }

    // Update facing only when there's input, so idle preserves last facing.
    if (leftDown && !rightDown) this.facing = 'left';
    else if (rightDown && !leftDown) this.facing = 'right';
    else if (upDown && !downDown) this.facing = 'up';
    else if (downDown && !upDown) this.facing = 'down';
  }

  private handleAttack(time: number): void {
    if (!Phaser.Input.Keyboard.JustDown(this.wasd.attack)) return;
    if (time < this.nextAttackAt) return;

    this.nextAttackAt = time + ATTACK_COOLDOWN_MS;
    this.doAttack();
  }

  private doAttack(): void {
    const rect = this.computeAttackRect();

    // Visual feedback: brief tint flash.
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.clearTint());

    // Find dynamic bodies overlapping the attack rect.
    const bodies = this.scene.physics.overlapRect(
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      true,
      false,
    ) as Phaser.Physics.Arcade.Body[];

    for (const body of bodies) {
      const go = body.gameObject;
      if (go === this) continue;
      if (isDamageable(go)) {
        go.takeDamage(this.stats.attack, this.x, this.y);
      }
    }
  }

  /** Compute an attack hitbox in world coordinates based on current facing. */
  private computeAttackRect(): Phaser.Geom.Rectangle {
    const horizontal = { w: 26, h: 22 };
    const vertical = { w: 22, h: 26 };
    const offset = 16;

    switch (this.facing) {
      case 'up':
        return new Phaser.Geom.Rectangle(
          this.x - vertical.w / 2,
          this.y - offset - vertical.h,
          vertical.w,
          vertical.h,
        );
      case 'down':
        return new Phaser.Geom.Rectangle(
          this.x - vertical.w / 2,
          this.y + offset,
          vertical.w,
          vertical.h,
        );
      case 'left':
        return new Phaser.Geom.Rectangle(
          this.x - offset - horizontal.w,
          this.y - horizontal.h / 2,
          horizontal.w,
          horizontal.h,
        );
      case 'right':
      default:
        return new Phaser.Geom.Rectangle(
          this.x + offset,
          this.y - horizontal.h / 2,
          horizontal.w,
          horizontal.h,
        );
    }
  }

  takeDamage(amount: number, fromX?: number, fromY?: number): void {
    const now = this.scene.time.now;
    if (now < this.invulnerableUntil) return;
    if (!this.active) return;

    const damage = calcDamage(amount, this.stats.defense);
    this.hp = Math.max(0, this.hp - damage);
    this.invulnerableUntil = now + INVULN_DURATION_MS;

    // Knockback away from source.
    if (fromX !== undefined && fromY !== undefined) {
      const angle = Phaser.Math.Angle.Between(fromX, fromY, this.x, this.y);
      this.setVelocity(
        Math.cos(angle) * KNOCKBACK_SPEED,
        Math.sin(angle) * KNOCKBACK_SPEED,
      );
      this.knockbackUntil = now + KNOCKBACK_DURATION_MS;
    }

    // Blink while invulnerable.
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 90,
      yoyo: true,
      repeat: 3,
      onComplete: () => this.setAlpha(1),
    });

    this.scene.events.emit('player-damaged', this.hp, this.maxHp);

    if (this.hp <= 0) {
      this.onDeath();
    }
  }

  private onDeath(): void {
    this.setActive(false);
    this.setVelocity(0, 0);
    this.setAlpha(0.4);
    this.scene.events.emit('player-died');
  }
}
