import Phaser from 'phaser';
import { makeParticleTextures } from '../art/effects';
import { makeFishTextures } from '../art/fish';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    makeFishTextures(this);
    makeParticleTextures(this);
    this.scene.launch('Input');
    this.scene.start('Attract');
  }
}
