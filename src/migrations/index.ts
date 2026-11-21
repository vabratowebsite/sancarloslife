import * as migration_20261121_085510_initial from './20261121_085510_initial';

export const migrations = [
  {
    up: migration_20261121_085510_initial.up,
    down: migration_20261121_085510_initial.down,
    name: '20261121_085510_initial'
  },
];
