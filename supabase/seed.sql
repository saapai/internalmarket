-- =============================================
-- Seed data: 26 categories with 3 candidates each = 78 markets
-- Run this AFTER migration.sql
-- =============================================

-- Category 1: Indian of the Year
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Indian of the Year', 1) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Yashas', 'Arjun', 'Priya']) FROM cat;

-- Category 2: Most Likely to Become a CEO
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Likely to Become a CEO', 2) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Rahul', 'Sneha', 'Vikram']) FROM cat;

-- Category 3: Life of the Party
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Life of the Party', 3) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['DJ Karan', 'Meera', 'Aditya']) FROM cat;

-- Category 4: Best Dressed
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Dressed', 4) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Ananya', 'Rohan', 'Ishita']) FROM cat;

-- Category 5: Most Likely to Go Viral
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Likely to Go Viral', 5) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Nikhil', 'Kavya', 'Siddharth']) FROM cat;

-- Category 6: Cutest Couple
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Cutest Couple', 6) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Riya & Aman', 'Neha & Dev', 'Pooja & Raj']) FROM cat;

-- Category 7: Most Athletic
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Athletic', 7) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Kabir', 'Tanya', 'Harsh']) FROM cat;

-- Category 8: Class Clown
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Class Clown', 8) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Varun', 'Diya', 'Pranav']) FROM cat;

-- Category 9: Most Likely to Win a Nobel Prize
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Likely to Win a Nobel Prize', 9) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Shreya', 'Arnav', 'Ritika']) FROM cat;

-- Category 10: Best Hair
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Hair', 10) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Saanvi', 'Dhruv', 'Aarav']) FROM cat;

-- Category 11: Most Likely to Travel the World
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Likely to Travel the World', 11) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Simran', 'Kunal', 'Aisha']) FROM cat;

-- Category 12: Best Smile
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Smile', 12) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Navya', 'Ayaan', 'Zara']) FROM cat;

-- Category 13: Most Likely to Be Famous
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Likely to Be Famous', 13) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Vihaan', 'Kiara', 'Reyansh']) FROM cat;

-- Category 14: Biggest Foodie
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Biggest Foodie', 14) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Manav', 'Myra', 'Aryan']) FROM cat;

-- Category 15: Best Dance Moves
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Dance Moves', 15) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Anvi', 'Shaurya', 'Sara']) FROM cat;

-- Category 16: Most Likely to Write a Book
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Likely to Write a Book', 16) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Ira', 'Advait', 'Nisha']) FROM cat;

-- Category 17: Best Sense of Humor
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Sense of Humor', 17) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Kabir M', 'Aanya', 'Om']) FROM cat;

-- Category 18: Most Studious
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Studious', 18) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Vivaan', 'Samaira', 'Atharv']) FROM cat;

-- Category 19: Best Glow Up
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Glow Up', 19) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Aditi', 'Krishna', 'Pari']) FROM cat;

-- Category 20: Most Likely to Be a Billionaire
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Likely to Be a Billionaire', 20) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Rudra', 'Anaya', 'Laksh']) FROM cat;

-- Category 21: Best Vocalist
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Vocalist', 21) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Sia', 'Aadi', 'Trisha']) FROM cat;

-- Category 22: Most Photogenic
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Photogenic', 22) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Mira', 'Yash', 'Aadhya']) FROM cat;

-- Category 23: Best Duo / Friendship
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Duo / Friendship', 23) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Rishi & Neil', 'Tara & Maya', 'Jay & Krish']) FROM cat;

-- Category 24: Most Likely to Be on Shark Tank
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Likely to Be on Shark Tank', 24) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Sanya', 'Ishan', 'Pihu']) FROM cat;

-- Category 25: Biggest Flirt
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Biggest Flirt', 25) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Ahaan', 'Kyra', 'Rehan']) FROM cat;

-- Category 26: Most School Spirit
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most School Spirit', 26) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Veer', 'Avni', 'Aarav K']) FROM cat;
