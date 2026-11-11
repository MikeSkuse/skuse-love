-- Preserve existing IDs and any table numbers already configured in the database.
UPDATE tables SET display_number = '1' WHERE id = 'theme_1' AND display_number IS NULL;
UPDATE tables SET display_number = '2' WHERE id = 'theme_2' AND display_number IS NULL;
UPDATE tables SET display_number = '3' WHERE id = 'theme_3' AND display_number IS NULL;
UPDATE tables SET display_number = '4' WHERE id = 'theme_4' AND display_number IS NULL;
UPDATE tables SET display_number = '5' WHERE id = 'theme_5' AND display_number IS NULL;
UPDATE tables SET display_number = '6' WHERE id = 'theme_6' AND display_number IS NULL;
