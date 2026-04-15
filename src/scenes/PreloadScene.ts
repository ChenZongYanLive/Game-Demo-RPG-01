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
    // Real asset loading will be added once Tiled maps and sprites exist:
    //   this.load.tilemapTiledJSON('town', 'assets/tilemaps/town.json');
    //   this.load.image('tiles', 'assets/tilemaps/tileset.png');
    //   this.load.atlas('player', 'assets/sprites/player.png', 'assets/sprites/player.json');
  }

  create(): void {
    this.generatePlaceholderTextures();
    this.scene.start('MainMenuScene');
  }

  /**
   * Until real art is in place, draw the tileset and player sprites
   * programmatically so the game is fully self-contained.
   * Tileset layout (64x32): [0] grass, [1] wall.
   */
  private generatePlaceholderTextures(): void {
    // --- Tileset: 2 tiles of 32x32 side by side ---
    const tileG = this.make.graphics({ x: 0, y: 0 }, false);

    // Tile 0: grass
    tileG.fillStyle(0x3b7a3b, 1);
    tileG.fillRect(0, 0, 32, 32);
    tileG.fillStyle(0x4a8a4a, 1);
    tileG.fillRect(5, 6, 3, 3);
    tileG.fillRect(22, 10, 3, 3);
    tileG.fillRect(12, 22, 3, 3);

    // Tile 1: wall
    tileG.fillStyle(0x6b6b6b, 1);
    tileG.fillRect(32, 0, 32, 32);
    tileG.lineStyle(2, 0x3a3a3a, 1);
    tileG.strokeRect(33, 1, 30, 30);
    tileG.fillStyle(0x8a8a8a, 1);
    tileG.fillRect(36, 4, 10, 10);
    tileG.fillRect(48, 18, 10, 10);

    tileG.generateTexture('tiles', 64, 32);
    tileG.destroy();

    // --- Player: 24x24 circle with a facing dot ---
    const playerG = this.make.graphics({ x: 0, y: 0 }, false);
    playerG.fillStyle(0x9ad3ff, 1);
    playerG.fillCircle(12, 12, 11);
    playerG.lineStyle(2, 0x2a2a3e, 1);
    playerG.strokeCircle(12, 12, 11);
    playerG.fillStyle(0x2a2a3e, 1);
    playerG.fillCircle(12, 9, 2.5);
    playerG.generateTexture('player', 24, 24);
    playerG.destroy();
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
