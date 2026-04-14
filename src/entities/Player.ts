import Phaser from 'phaser';

const PLAYER_SPEED = 160;
const DIAGONAL_SPEED = PLAYER_SPEED / Math.SQRT2;

type WasdKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

/**
 * Player entity. Reads WASD / arrow keys and drives arcade physics velocity.
 * No animations yet — placeholder circle sprite is generated in PreloadScene.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: WasdKeys;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    // Placeholder sprite is 24x24; use an inscribed circle for nicer collision.
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
    };
  }

  override update(): void {
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
  }
}
