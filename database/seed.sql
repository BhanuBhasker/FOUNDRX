-- =====================================================================
-- FOUNDRX — Seed data (master lists + a few demo records)
-- =====================================================================
USE foundrx;

INSERT INTO Skills (skill_name, category) VALUES
('React', 'frontend'), ('JavaScript', 'frontend'), ('TypeScript', 'frontend'),
('Node.js', 'backend'), ('Express', 'backend'), ('Python', 'backend'),
('MySQL', 'database'), ('PostgreSQL', 'database'), ('MongoDB', 'database'),
('UI/UX Design', 'design'), ('Figma', 'design'), ('Graphic Design', 'design'),
('Product Management', 'product'), ('Growth Marketing', 'marketing'),
('SEO', 'marketing'), ('Sales', 'business'), ('Fundraising', 'business'),
('Data Analysis', 'data'), ('Machine Learning', 'data'), ('DevOps', 'infra')
AS new
ON DUPLICATE KEY UPDATE category = new.category;

INSERT INTO Interests (interest_name) VALUES
('FinTech'), ('HealthTech'), ('EdTech'), ('E-commerce'), ('AI/ML'),
('Climate Tech'), ('SaaS'), ('Gaming'), ('Social Impact'), ('Web3')
AS new
ON DUPLICATE KEY UPDATE interest_name = new.interest_name;
