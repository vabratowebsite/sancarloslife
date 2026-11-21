import * as migration_20261121_142147_initial from './20261121_142147_initial';

export const migrations = [
  {
    up: migration_20261121_142147_initial.up,
    down: migration_20261121_142147_initial.down,
    name: '20261121_142147_initial'
  },
];
