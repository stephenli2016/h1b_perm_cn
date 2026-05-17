# Postgres Production Migrations

These SQL files prepare the production Postgres/Supabase schema while local
development continues to run in fixture mode.

Primary migration:

- `0001_initial_schema.sql`

The migration mirrors the local SQLite schema but uses Postgres-native types
such as `date`, `timestamptz`, `numeric`, `boolean`, and `jsonb`.

## Safety Defaults

- Row Level Security is enabled on every table in the `public` schema.
- No public `anon` or `authenticated` table policies are created in M26.
- Supabase `service_role` access is granted only when that role exists.
- Public browser code must never receive `SUPABASE_SERVICE_ROLE_KEY`.

## Validation

Run:

```bash
pnpm db:production:validate
```

The validator checks required tables, indexes, RLS statements, environment
placeholders, and obvious secret/public-access mistakes.
