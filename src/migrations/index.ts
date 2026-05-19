import * as migration_20260510_114306_initial_3_84_localization from './20260510_114306_initial_3_84_localization';
import * as migration_20260510_122046_unlocalize_categories_breadcrumbs from './20260510_122046_unlocalize_categories_breadcrumbs';
import * as migration_20260510_125000_resources_localized_fields from './20260510_125000_resources_localized_fields';

import * as migration_20260511_140000_posts_spanish_mirrors_english from './20260511_140000_posts_spanish_mirrors_english';

import * as migration_20260518_000000_categories_localized_strings from './20260518_000000_categories_localized_strings';

export const migrations = [
  {
    up: migration_20260510_114306_initial_3_84_localization.up,
    down: migration_20260510_114306_initial_3_84_localization.down,
    name: '20260510_114306_initial_3_84_localization',
  },
  {
    up: migration_20260510_122046_unlocalize_categories_breadcrumbs.up,
    down: migration_20260510_122046_unlocalize_categories_breadcrumbs.down,
    name: '20260510_122046_unlocalize_categories_breadcrumbs'
  },
  {
    up: migration_20260510_125000_resources_localized_fields.up,
    down: migration_20260510_125000_resources_localized_fields.down,
    name: '20260510_125000_resources_localized_fields'
  },
  {
    up: migration_20260511_140000_posts_spanish_mirrors_english.up,
    down: migration_20260511_140000_posts_spanish_mirrors_english.down,
    name: '20260511_140000_posts_spanish_mirrors_english',
  },
  {
    up: migration_20260518_000000_categories_localized_strings.up,
    down: migration_20260518_000000_categories_localized_strings.down,
    name: '20260518_000000_categories_localized_strings',
  },
];
