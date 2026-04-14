import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

/**
 * MainMenuScene: title screen. Press SPACE/ENTER to start the world.
 * Will be expanded in M5 with load-game, options, etc.
 */
export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    this.add
      .text(centerX, centerY - 60, 'Hello RPG', {
        fontFamily: 'monospace',
        fontSize: '56px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 10, 'Game-Demo-RPG-01', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#9ad3ff',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(centerX, centerY + 80, 'Press SPACE or ENTER to start', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#eaeaea',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const startGame = () => this.scene.start('WorldScene');
    this.input.keyboard?.once('keydown-SPACE', startGame);
    this.input.keyboard?.once('keydown-ENTER', startGame);
  }
}
