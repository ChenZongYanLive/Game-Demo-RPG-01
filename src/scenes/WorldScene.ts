import Phaser from 'phaser';
import { Player } from '../entities/Player';

const TILE = 32;
const MAP_W = 30;
const MAP_H = 20;

const TILE_GRASS = 0;
const TILE_WALL = 1;

/**
 * WorldScene: main exploration scene. M1 scope:
 * - programmatic tilemap (grass + wall) with collision
 * - Player entity with WASD / arrow movement
 * - camera follow within map bounds
 *
 * A real Tiled-exported tilemap and sprite atlas will replace the
 * programmatic textures in a later pass.
 */
export class WorldScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    const map = this.buildTilemap();
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE);
    if (!tileset) {
      throw new Error('WorldScene: failed to register tileset image');
    }

    const layer = map.createLayer(0, tileset, 0, 0);
    if (!layer) {
      throw new Error('WorldScene: failed to create tile layer');
    }
    layer.setCollision([TILE_WALL]);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    this.player = new Player(this, TILE * 2 + TILE / 2, TILE * 2 + TILE / 2, 'player');
    this.physics.add.collider(this.player, layer);

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);

    this.drawHud();

    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }

  override update(): void {
    this.player.update();
  }

  private buildTilemap(): Phaser.Tilemaps.Tilemap {
    const data = this.buildMapData();
    return this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
  }

  /**
   * Returns a 2D array of tile indices. Border walls + a few interior
   * obstacles so the player can test collision and camera scrolling.
   */
  private buildMapData(): number[][] {
    const rows: number[][] = [];
    for (let y = 0; y < MAP_H; y++) {
      const row: number[] = [];
      for (let x = 0; x < MAP_W; x++) {
        const isBorder = x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1;
        const pillarA = x === 8 && y >= 5 && y <= 9;
        const pillarB = x === 20 && y >= 8 && y <= 13;
        const innerWall = y === 4 && x >= 13 && x <= 17;
        row.push(isBorder || pillarA || pillarB || innerWall ? TILE_WALL : TILE_GRASS);
      }
      rows.push(row);
    }
    return rows;
  }

  private drawHud(): void {
    this.add
      .text(10, 10, 'WASD / Arrow keys: move   •   ESC: menu', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#eaeaea',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);
  }
}
