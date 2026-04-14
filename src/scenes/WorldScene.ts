import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

/**
 * WorldScene: main exploration scene. For M0 this is a placeholder
 * that just shows the player can "enter" the world. M1 will add
 * a Tiled tilemap, player sprite, collision, and movement.
 */
export class WorldScene extends Phaser.Scene {
  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    this.add
      .text(centerX, centerY - 20, 'World Scene (M0 placeholder)', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 20, 'Press ESC to return to menu', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9ad3ff',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }
}
