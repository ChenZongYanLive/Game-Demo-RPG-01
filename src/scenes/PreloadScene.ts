import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

/**
 * PreloadScene: loads the main asset bundle for the game and shows
 * a progress bar while loading. For M0 there are no assets yet.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.drawProgressBar();
    // Real asset loading will be added in M1+:
    //   this.load.tilemapTiledJSON('town', 'assets/tilemaps/town.json');
    //   this.load.image('tiles', 'assets/tilemaps/tileset.png');
    //   this.load.atlas('player', 'assets/sprites/player.png', 'assets/sprites/player.json');
  }

  create(): void {
    this.scene.start('MainMenuScene');
  }

  private drawProgressBar(): void {
    const width = GAME_WIDTH;
    const height = GAME_HEIGHT;

    const barWidth = 320;
    const barHeight = 24;
    const barX = (width - barWidth) / 2;
    const barY = height / 2 - barHeight / 2;

    const border = this.add.graphics();
    border.lineStyle(2, 0xffffff, 1);
    border.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);

    const fill = this.add.graphics();

    const label = this.add
      .text(width / 2, barY - 24, 'Loading...', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.clear();
      fill.fillStyle(0x9ad3ff, 1);
      fill.fillRect(barX, barY, barWidth * value, barHeight);
    });

    this.load.on('complete', () => {
      border.destroy();
      fill.destroy();
      label.destroy();
    });
  }
}
