-- Insert the new IDs first so any legacy guest references remain valid throughout.
-- A conflicting numeric ID causes the migration to fail rather than overwrite it.
INSERT INTO tables (id, theme, display_number)
SELECT substr(id, 7), theme, display_number FROM tables
WHERE id IN ('theme_1', 'theme_2', 'theme_3', 'theme_4', 'theme_5', 'theme_6');

UPDATE guests SET table_id = substr(table_id, 7)
WHERE table_id IN ('theme_1', 'theme_2', 'theme_3', 'theme_4', 'theme_5', 'theme_6');

DELETE FROM tables WHERE id IN ('theme_1', 'theme_2', 'theme_3', 'theme_4', 'theme_5', 'theme_6');
