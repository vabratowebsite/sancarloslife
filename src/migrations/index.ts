import * as migration_20261121_085510_initial from './20261121_085510_initial';
import * as migration_20261121_104244_post_initial_fields from './20261121_104244_post_initial_fields';
import * as migration_20261121_121048_team_testimonials_blocks from './20261121_121048_team_testimonials_blocks';

export const migrations = [
  {
    up: migration_20261121_085510_initial.up,
    down: migration_20261121_085510_initial.down,
    name: '20261121_085510_initial',
  },
  {
    up: migration_20261121_104244_post_initial_fields.up,
    down: migration_20261121_104244_post_initial_fields.down,
    name: '20261121_104244_post_initial_fields',
  },
  {
    up: migration_20261121_121048_team_testimonials_blocks.up,
    down: migration_20261121_121048_team_testimonials_blocks.down,
    name: '20261121_121048_team_testimonials_blocks'
  },
];
