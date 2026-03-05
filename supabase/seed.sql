-- =============================================
-- SEP Winter Formal Superlative Seed Data
-- 26 categories from the actual voting form
-- =============================================

-- 1. Indian of the Year
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Indian of the Year', 1) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Yashas', 'Anish', 'Henry']) FROM cat;

-- 2. Biggest Alcoholic
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Biggest Alcoholic', 2) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Kera', 'Henry', 'Armaan']) FROM cat;

-- 3. Asian of the Year
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Asian of the Year', 3) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Ming', 'Elise', 'Jonathan']) FROM cat;

-- 4. Best Pledge Class
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Pledge Class', 4) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Alpha Epsilon', 'Alpha Zeta', 'Alpha Delta']) FROM cat;

-- 5. Most Likely to Blackout
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Likely to Blackout', 5) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Elijah', 'Armaan', 'Dilnar']) FROM cat;

-- 6. White Boy of the Year
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('White Boy of the Year', 6) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Quinn', 'Evan', 'Tyler']) FROM cat;

-- 7. Best Big Little
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Big Little', 7) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Sophie Sharan / Maddie', 'Mahi + Ani', 'Evan + Armaan']) FROM cat;

-- 8. Best Pseudo Big Little
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Pseudo Big Little', 8) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Sophie + Kera', 'Natalie + Matthew', 'Allie + Barima']) FROM cat;

-- 9. Best Shoulders to Cry On
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Shoulders to Cry On', 9) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Sam', 'Armaan', 'Elijah']) FROM cat;

-- 10. Best Shoulders
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Shoulders', 10) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Sharan', 'Ani', 'Ming']) FROM cat;

-- 11. Biggest Back
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Biggest Back', 11) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Sharan', 'Ani', 'Ming']) FROM cat;

-- 12. Biggest Big Back
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Biggest Big Back', 12) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Dilnar', 'Kera', 'Ming']) FROM cat;

-- 13. Best Dressed
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Dressed', 13) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Sophie', 'Elise', 'Ruhaan']) FROM cat;

-- 14. Fratcest
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Fratcest', 14) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Kera', 'Armaan']) FROM cat;

-- 15. Best Romance
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Romance', 15) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Glizzy + Layla', 'Armaan + Anannya']) FROM cat;

-- 16. Best Bromance
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Bromance', 16) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Tyler + Henry', 'Henry + Matthew', 'Ani + Quinn']) FROM cat;

-- 17. Best Gal Pals
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Gal Pals', 17) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Fiona + Kera', 'Kera + Maddie', 'Abby + Sidney']) FROM cat;

-- 18. Best Trio
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Trio', 18) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Franco + Anish + Quinn', 'Rahul + Natalie + Saathvik']) FROM cat;

-- 19. Most Performative
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Performative', 19) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Ash', 'Yashas']) FROM cat;

-- 20. Most Likely to Solve World Peace
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Likely to Solve World Peace', 20) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Sonali', 'Lindsey', 'Joseph']) FROM cat;

-- 21. Best Aux
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Best Aux', 21) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Yashas', 'Sophie', 'Joseph']) FROM cat;

-- 22. SEP MVP
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('SEP MVP', 22) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Ash', 'Sophie', 'Mahi']) FROM cat;

-- 23. "Founder" in Bio After Making GPT Wrapper
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('"Founder" in Bio After Making GPT Wrapper', 23) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Yashas', 'Brandon']) FROM cat;

-- 24. Funniest Active
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Funniest Active', 24) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Joanna', 'Sam', 'Layla', 'Anish']) FROM cat;

-- 25. Biggest Pick Me
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Biggest Pick Me', 25) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Tyler', 'Ash']) FROM cat;

-- 26. Most Brain Rot
WITH cat AS (INSERT INTO categories (title, sort_order) VALUES ('Most Brain Rot', 26) RETURNING id)
INSERT INTO markets (category_id, candidate) SELECT id, unnest(ARRAY['Kera', 'Dilnar', 'Joanna']) FROM cat;
