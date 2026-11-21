import * as migration_20261121_191524_initial from './20261121_191524_initial';

export const migrations = [
  {
    up: migration_20261121_191524_initial.up,
    down: migration_20261121_191524_initial.down,
    name: '20261121_191524_initial'
  },
];
