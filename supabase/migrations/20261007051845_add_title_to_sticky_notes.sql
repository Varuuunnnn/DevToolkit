/*
# Add title column to sticky_notes table

1. Modified Tables
- `sticky_notes`
- Added `title` (text, defaults to empty string) — stores the sticky note title entered by the user
2. Security
- No changes to existing RLS policies. The existing anon+authenticated CRUD policies already cover the new column.
3. Notes
- This is an additive migration — no data is lost or modified.
- The existing notes in localStorage that get archived to the DB will include the title field.
*/

ALTER TABLE sticky_notes
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
