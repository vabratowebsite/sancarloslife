import * as migration_20261121_182002_initial from './20261121_182002_initial';

export const migrations = [
  {
    up: migration_20261121_182002_initial.up,
    down: migration_20261121_182002_initial.down,
    name: '20261121_182002_initial'
  },
];
