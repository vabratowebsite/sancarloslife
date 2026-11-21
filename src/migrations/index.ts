import * as migration_20261121_085510_initial from './20261121_085510_initial';
import * as migration_20261121_104244_post_initial_fields from './20261121_104244_post_initial_fields';

export const migrations = [
  {
    up: migration_20261121_085510_initial.up,
    down: migration_20261121_085510_initial.down,
    name: '20261121_085510_initial',
  },
  {
    up: migration_20261121_104244_post_initial_fields.up,
    down: migration_20261121_104244_post_initial_fields.down,
    name: '20261121_104244_post_initial_fields'
  },
];
