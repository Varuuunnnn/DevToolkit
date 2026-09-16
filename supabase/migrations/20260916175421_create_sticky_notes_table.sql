/*
# Create sticky_notes table (single-tenant, no auth)

1. New Tables
- `sticky_notes`
- `id` (uuid, primary key)
- `content` (text, the note text, defaults to empty string)
- `x` (integer, x position in px, defaults to 40)
- `y` (integer, y position in px, defaults to 40)
- `color` (text, the sticky note color, defaults to 'yellow')
- `created_at` (timestamp)
- `updated_at` (timestamp, auto-updated on change)
2. Security
- Enable RLS on `sticky_notes`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public (no-auth app).
*/

CREATE TABLE IF NOT EXISTS sticky_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL DEFAULT '',
  x integer NOT NULL DEFAULT 40,
  y integer NOT NULL DEFAULT 40,
  color text NOT NULL DEFAULT 'yellow',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sticky_notes" ON sticky_notes;
CREATE POLICY "anon_select_sticky_notes" ON sticky_notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sticky_notes" ON sticky_notes;
CREATE POLICY "anon_insert_sticky_notes" ON sticky_notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sticky_notes" ON sticky_notes;
CREATE POLICY "anon_update_sticky_notes" ON sticky_notes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sticky_notes" ON sticky_notes;
CREATE POLICY "anon_delete_sticky_notes" ON sticky_notes FOR DELETE
  TO anon, authenticated USING (true);
