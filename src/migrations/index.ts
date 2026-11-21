import * as migration_20261121_131854_initial from './20261121_131854_initial';

export const migrations = [
  {
    up: migration_20261121_131854_initial.up,
    down: migration_20261121_131854_initial.down,
    name: '20261121_131854_initial'
  },
];
