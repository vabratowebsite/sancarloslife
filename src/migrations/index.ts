import * as migration_20261121_191524_initial from './20261121_191524_initial';
import * as migration_20261122_015029_place_design_b from './20261122_015029_place_design_b';

export const migrations = [
  {
    up: migration_20261121_191524_initial.up,
    down: migration_20261121_191524_initial.down,
    name: '20261121_191524_initial',
  },
  {
    up: migration_20261122_015029_place_design_b.up,
    down: migration_20261122_015029_place_design_b.down,
    name: '20261122_015029_place_design_b'
  },
];
