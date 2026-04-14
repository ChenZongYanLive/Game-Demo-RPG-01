import Phaser from 'phaser';

/**
 * BootScene: minimal scene that runs first.
 * Loads only what PreloadScene needs to show the loading bar.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load assets needed by the PreloadScene (e.g. loading-bar graphics).
    // Intentionally empty for M0 — PreloadScene draws its bar with Graphics.
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
