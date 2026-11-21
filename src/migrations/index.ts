import * as migration_20261121_123139_initial from './20261121_123139_initial';

export const migrations = [
  {
    up: migration_20261121_123139_initial.up,
    down: migration_20261121_123139_initial.down,
    name: '20261121_123139_initial'
  },
];
