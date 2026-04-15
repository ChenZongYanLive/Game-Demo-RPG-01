import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';

const TILE = 32;
const MAP_W = 30;
const MAP_H = 20;

const TILE_GRASS = 0;
const TILE_WALL = 1;

/**
 * Enemy spawn points in tile coordinates.
 */
const ENEMY_SPAWNS: Array<[number, number]> = [
  [10, 10],
  [15, 7],
  [22, 14],
  [5, 14],
];

/**
 * WorldScene: exploration + combat loop.
 * - Programmatic tilemap (grass + walls) with collision
 * - Player with WASD/arrows, SPACE to attack
 * - Enemy group with chase AI and contact damage
 * - HUD for HP + kill counter
 * - Game-over overlay with retry
 */
export class WorldScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private hpText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private killCount = 0;
  private gameOver = false;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    this.killCount = 0;
    this.gameOver = false;

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

    this.enemies = this.physics.add.group({ runChildUpdate: true });
    for (const [tx, ty] of ENEMY_SPAWNS) {
      const enemy = new Enemy(
        this,
        tx * TILE + TILE / 2,
        ty * TILE + TILE / 2,
        'enemy',
        this.player,
      );
      this.enemies.add(enemy);
    }
    this.physics.add.collider(this.enemies, layer);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.overlap(this.player, this.enemies, (_playerObj, enemyObj) => {
      if (this.gameOver) return;
      (enemyObj as Enemy).tryHitPlayer(this.player, this.time.now);
    });

    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);

    this.drawHud();

    // Scene-level event wiring.
    this.events.on('enemy-killed', this.onEnemyKilled, this);
    this.events.on('player-damaged', this.updateHpText, this);
    this.events.on('player-died', this.showGameOver, this);

    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('MainMenuScene'));
  }

  override update(time: number, delta: number): void {
    if (this.gameOver) return;
    this.player.update(time, delta);
  }

  private onEnemyKilled(): void {
    this.killCount += 1;
    this.killsText.setText(`Kills: ${this.killCount}`);
  }

  private updateHpText(hp: number, maxHp: number): void {
    this.hpText.setText(`HP: ${hp} / ${maxHp}`);
  }

  private showGameOver(): void {
    this.gameOver = true;

    const { width, height } = this.scale;
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 0.65)
      .setScrollFactor(0)
      .setDepth(200);

    const title = this.add
      .text(width / 2, height / 2 - 20, 'You Died', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#ff7676',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);

    const hint = this.add
      .text(width / 2, height / 2 + 30, 'Press R to retry  •  ESC for menu', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#eaeaea',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(201);

    // Avoid unused warnings; discard refs since they live with the scene.
    void overlay;
    void title;
    void hint;

    this.input.keyboard?.once('keydown-R', () => this.scene.restart());
  }

  private buildTilemap(): Phaser.Tilemaps.Tilemap {
    const data = this.buildMapData();
    return this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
  }

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
      .text(
        10,
        10,
        'WASD / Arrow keys: move   •   SPACE: attack   •   ESC: menu',
        {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#eaeaea',
          backgroundColor: '#000000aa',
          padding: { x: 6, y: 4 },
        },
      )
      .setScrollFactor(0)
      .setDepth(100);

    this.hpText = this.add
      .text(10, 34, `HP: ${this.player.hp} / ${this.player.maxHp}`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#9ad3ff',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.killsText = this.add
      .text(10, 62, `Kills: ${this.killCount}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffe066',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);
  }
}
