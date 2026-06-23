# Dashboard and service-card update

## Dashboard redesign

The admin area now uses the same warm paper, charcoal and muted-gold palette as the public website. The login page, dashboard background, panels, storage meter, inputs and action buttons share the public design language while retaining clear danger states for destructive actions.

## Editable services

The dashboard includes a **Tjänstekort** section where an administrator can:

- add a card with an uploaded image
- edit title, description, price, button label and position
- replace a card image
- remove a card and its uploaded image
- control display order with the numeric position field

The `/services` page reads these cards from Supabase and falls back to the three bundled demo cards when Supabase is unavailable or the table is empty.

## Required database step

For an existing database, run `docs/SERVICES_MIGRATION.sql` once in the Supabase SQL editor. It creates the table, public read policy and imports the three existing service cards so they can be edited immediately.
