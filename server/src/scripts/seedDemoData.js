/**
 * Populates the database with a realistic set of demo data — users,
 * profiles, skills/interests, startups, applications, projects,
 * milestones, reviews and saved profiles — so the app can be demoed
 * end-to-end (Discover, Dashboard, Applications, Notifications, Admin,
 * Analytics) without manually clicking through the UI first.
 *
 * Safe to re-run: it wipes every demo-owned row before reinserting, so
 * you can run this again right before a demo to reset to a clean state.
 *
 * Usage: npm run db:seed:demo   (from repo root or server/ workspace)
 *
 * All seeded accounts share one password — see DEMO_PASSWORD below —
 * printed again at the end of the run along with each login email.
 */
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

const DEMO_PASSWORD = 'Demo@1234';
const SALT_ROUNDS = 12;

// ---------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------
const SKILL_NAMES = [
  'React', 'JavaScript', 'TypeScript', 'Node.js', 'Express', 'Python',
  'MySQL', 'PostgreSQL', 'MongoDB', 'UI/UX Design', 'Figma', 'Graphic Design',
  'Product Management', 'Growth Marketing', 'SEO', 'Sales', 'Fundraising',
  'Data Analysis', 'Machine Learning', 'DevOps',
];
const INTEREST_NAMES = ['FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'AI/ML', 'Climate Tech', 'SaaS', 'Gaming', 'Social Impact', 'Web3'];

// ---------------------------------------------------------------------
// Users (index 0 is the "log in as me" demo/admin account)
// ---------------------------------------------------------------------
const USERS = [
  { name: 'Aditya Mehrotra', email: 'demo@foundrx.dev', role: 'admin', primary_role: 'product', experience_level: 'expert', availability_hours: 'full_time', startup_goal: 'find_cofounder', location: 'Bengaluru, India', headline: 'Building FOUNDRX — helping builders find their people', bio: 'Product-minded builder who has shipped three side projects and is now looking for a technical co-founder to go all-in on FOUNDRX.', linkedin_url: 'https://linkedin.com/in/aditya-mehrotra', github_url: 'https://github.com/adityamehrotra', skills: [['Product Management', 'expert'], ['Data Analysis', 'advanced'], ['Growth Marketing', 'intermediate']], interests: ['SaaS', 'AI/ML'] },
  { name: 'Priya Sharma', email: 'priya.sharma@example.com', role: 'user', primary_role: 'developer', experience_level: 'advanced', availability_hours: 'full_time', startup_goal: 'find_cofounder', location: 'Bengaluru, India', headline: 'Full-stack engineer, ex-Swiggy', bio: 'I love turning fuzzy ideas into shipped products. Looking for a co-founder with sales/growth chops.', linkedin_url: 'https://linkedin.com/in/priyasharma', github_url: 'https://github.com/priyasharma', skills: [['React', 'expert'], ['Node.js', 'advanced'], ['MySQL', 'advanced'], ['DevOps', 'intermediate']], interests: ['SaaS', 'FinTech'] },
  { name: 'Rahul Verma', email: 'rahul.verma@example.com', role: 'user', primary_role: 'developer', experience_level: 'expert', availability_hours: 'full_time', startup_goal: 'build_projects', location: 'Pune, India', headline: 'Backend & ML engineer', bio: 'Ten years building data-heavy backend systems. Currently exploring AI/ML applications in logistics.', linkedin_url: 'https://linkedin.com/in/rahulverma', github_url: 'https://github.com/rahulverma', skills: [['Python', 'expert'], ['Machine Learning', 'advanced'], ['PostgreSQL', 'advanced'], ['DevOps', 'advanced']], interests: ['AI/ML', 'Climate Tech'] },
  { name: 'Ananya Iyer', email: 'ananya.iyer@example.com', role: 'user', primary_role: 'designer', experience_level: 'advanced', availability_hours: 'part_time', startup_goal: 'join_startup', location: 'Chennai, India', headline: 'Product designer obsessed with delightful UX', bio: 'Freelance product designer, 6 years across fintech and healthtech. Looking to join an early-stage team part-time.', linkedin_url: 'https://linkedin.com/in/ananyaiyer', github_url: null, skills: [['UI/UX Design', 'expert'], ['Figma', 'expert'], ['Graphic Design', 'advanced']], interests: ['HealthTech', 'FinTech'] },
  { name: 'Karan Mehta', email: 'karan.mehta@example.com', role: 'user', primary_role: 'business', experience_level: 'advanced', availability_hours: 'full_time', startup_goal: 'find_cofounder', location: 'Mumbai, India', headline: 'Ex-VC associate turned operator', bio: 'Spent 4 years evaluating startups at a fintech-focused fund; now want to build one, focused on cross-border payments.', linkedin_url: 'https://linkedin.com/in/karanmehta', github_url: null, skills: [['Fundraising', 'expert'], ['Sales', 'advanced'], ['Data Analysis', 'intermediate']], interests: ['FinTech', 'Web3'] },
  { name: 'Sneha Reddy', email: 'sneha.reddy@example.com', role: 'user', primary_role: 'developer', experience_level: 'intermediate', availability_hours: 'weekends', startup_goal: 'build_projects', location: 'Hyderabad, India', headline: 'Frontend dev learning backend', bio: 'React developer by day, building side projects on weekends. Love clean UI and fast iteration.', linkedin_url: 'https://linkedin.com/in/snehareddy', github_url: 'https://github.com/snehareddy', skills: [['React', 'advanced'], ['JavaScript', 'advanced'], ['TypeScript', 'intermediate']], interests: ['EdTech', 'SaaS'] },
  { name: 'Vikram Singh', email: 'vikram.singh@example.com', role: 'user', primary_role: 'business', experience_level: 'expert', availability_hours: 'full_time', startup_goal: 'find_cofounder', location: 'Delhi, India', headline: 'Circular-economy operator', bio: 'Ran supply chain ops for a D2C recycling brand for 5 years. Now building a marketplace for recycled industrial materials.', linkedin_url: 'https://linkedin.com/in/vikramsingh', github_url: null, skills: [['Sales', 'advanced'], ['Fundraising', 'intermediate'], ['SEO', 'beginner']], interests: ['Climate Tech', 'Social Impact'] },
  { name: 'Neha Kapoor', email: 'neha.kapoor@example.com', role: 'user', primary_role: 'marketing', experience_level: 'advanced', availability_hours: 'full_time', startup_goal: 'join_startup', location: 'Bengaluru, India', headline: 'Growth marketer, 0-to-1 specialist', bio: 'Took two D2C brands from zero to their first 10k customers through performance marketing and SEO.', linkedin_url: 'https://linkedin.com/in/nehakapoor', github_url: null, skills: [['Growth Marketing', 'expert'], ['SEO', 'advanced'], ['Data Analysis', 'intermediate']], interests: ['E-commerce', 'SaaS'] },
  { name: 'Arjun Nair', email: 'arjun.nair@example.com', role: 'user', primary_role: 'developer', experience_level: 'intermediate', availability_hours: 'full_time', startup_goal: 'join_startup', location: 'Kochi, India', headline: 'MERN stack developer', bio: 'Two years professional experience, comfortable across the MERN stack. Looking for my first startup role.', linkedin_url: 'https://linkedin.com/in/arjunnair', github_url: 'https://github.com/arjunnair', skills: [['MongoDB', 'intermediate'], ['Express', 'intermediate'], ['React', 'intermediate'], ['Node.js', 'intermediate']], interests: ['SaaS', 'Gaming'] },
  { name: 'Divya Menon', email: 'divya.menon@example.com', role: 'user', primary_role: 'product', experience_level: 'advanced', availability_hours: 'full_time', startup_goal: 'find_cofounder', location: 'Bengaluru, India', headline: 'PM building in EdTech', bio: 'Former PM at an edtech unicorn. Now bootstrapping a micro-learning platform and looking for a technical co-founder.', linkedin_url: 'https://linkedin.com/in/divyamenon', github_url: null, skills: [['Product Management', 'advanced'], ['Data Analysis', 'advanced'], ['SEO', 'beginner']], interests: ['EdTech', 'AI/ML'] },
  { name: 'Rohit Malhotra', email: 'rohit.malhotra@example.com', role: 'user', primary_role: 'developer', experience_level: 'expert', availability_hours: 'part_time', startup_goal: 'build_projects', location: 'Gurugram, India', headline: 'Staff engineer, part-time builder', bio: 'Staff engineer at a big tech co. Advising and contributing to a couple of early-stage projects on the side.', linkedin_url: 'https://linkedin.com/in/rohitmalhotra', github_url: 'https://github.com/rohitmalhotra', skills: [['TypeScript', 'expert'], ['Node.js', 'expert'], ['DevOps', 'advanced'], ['PostgreSQL', 'advanced']], interests: ['Web3', 'AI/ML'] },
  { name: 'Ishita Bose', email: 'ishita.bose@example.com', role: 'user', primary_role: 'designer', experience_level: 'intermediate', availability_hours: 'weekends', startup_goal: 'join_startup', location: 'Kolkata, India', headline: 'UI designer & illustrator', bio: 'Design generalist — UI, branding, and illustration. Building a portfolio of early-stage startup work.', linkedin_url: 'https://linkedin.com/in/ishitabose', github_url: null, skills: [['Figma', 'advanced'], ['UI/UX Design', 'intermediate'], ['Graphic Design', 'advanced']], interests: ['Gaming', 'Social Impact'] },
  { name: 'Aman Gupta', email: 'aman.gupta@example.com', role: 'user', primary_role: 'business', experience_level: 'intermediate', availability_hours: 'full_time', startup_goal: 'join_startup', location: 'Jaipur, India', headline: 'Sales & partnerships', bio: 'Built the first sales playbook at a seed-stage SaaS startup. Looking for the next early team to join.', linkedin_url: 'https://linkedin.com/in/amangupta', github_url: null, skills: [['Sales', 'advanced'], ['Fundraising', 'beginner']], interests: ['SaaS', 'FinTech'] },
  { name: 'Meera Pillai', email: 'meera.pillai@example.com', role: 'user', primary_role: 'developer', experience_level: 'advanced', availability_hours: 'full_time', startup_goal: 'find_cofounder', location: 'Thiruvananthapuram, India', headline: 'Data engineer exploring healthtech', bio: 'Built data pipelines for a healthtech scale-up. Want to build my own product around patient-care coordination.', linkedin_url: 'https://linkedin.com/in/meerapillai', github_url: 'https://github.com/meerapillai', skills: [['Python', 'advanced'], ['MySQL', 'advanced'], ['Data Analysis', 'expert'], ['Machine Learning', 'intermediate']], interests: ['HealthTech', 'AI/ML'] },
  { name: 'Yash Chawla', email: 'yash.chawla@example.com', role: 'user', primary_role: 'other', experience_level: 'beginner', availability_hours: 'weekends', startup_goal: 'explore_ideas', location: 'Chandigarh, India', headline: 'CS student exploring startups', bio: 'Final-year CS student. Curious about startups, still figuring out what I want to build.', linkedin_url: null, github_url: 'https://github.com/yashchawla', skills: [['JavaScript', 'beginner']], interests: ['Gaming', 'Web3'] },
  { name: 'Tanvi Joshi', email: 'tanvi.joshi@example.com', role: 'user', primary_role: 'marketing', experience_level: 'beginner', availability_hours: 'not_available', startup_goal: 'explore_ideas', location: 'Nagpur, India', headline: 'Marketing intern, exploring options', bio: 'Wrapping up an internship in digital marketing. Exploring what to do next.', linkedin_url: 'https://linkedin.com/in/tanvijoshi', github_url: null, skills: [['SEO', 'beginner']], interests: ['EdTech'] },
];

// ---------------------------------------------------------------------
// Startups — owner referenced by index into USERS
// ---------------------------------------------------------------------
const STARTUPS = [
  {
    ownerIdx: 1, name: 'NimbusAI', tagline: 'AI-powered inventory forecasting for D2C brands', category: 'AI/ML SaaS', stage: 'building', status: 'active', max_team_size: 6,
    description: 'NimbusAI helps D2C brands predict demand and cut excess inventory using lightweight ML models trained on their own sales history.',
    requiredSkills: [['Python', 'required'], ['Machine Learning', 'required'], ['React', 'nice_to_have'], ['Product Management', 'nice_to_have']],
  },
  {
    ownerIdx: 6, name: 'GreenLoop', tagline: 'A marketplace for recycled industrial materials', category: 'Climate Tech', stage: 'validating', status: 'active', max_team_size: 5,
    description: 'GreenLoop connects manufacturers with verified recyclers to give industrial scrap a second life, cutting landfill waste and material costs.',
    requiredSkills: [['Sales', 'required'], ['Growth Marketing', 'nice_to_have'], ['React', 'required']],
  },
  {
    ownerIdx: 0, name: 'MediSync', tagline: 'Care coordination for multi-clinic healthcare teams', category: 'HealthTech', stage: 'active', status: 'active', max_team_size: 8,
    description: 'MediSync gives clinics a shared timeline of patient care across doctors, so nothing falls through the cracks during referrals and follow-ups.',
    requiredSkills: [['Python', 'required'], ['MySQL', 'required'], ['UI/UX Design', 'required'], ['Data Analysis', 'nice_to_have']],
  },
  {
    ownerIdx: 9, name: 'EduSpark', tagline: 'Micro-learning for busy working professionals', category: 'EdTech', stage: 'idea', status: 'active', max_team_size: 4,
    description: 'EduSpark turns any skill into a 5-minute-a-day learning path, using spaced repetition to make new habits stick.',
    requiredSkills: [['React', 'required'], ['Node.js', 'required'], ['UI/UX Design', 'nice_to_have']],
  },
  {
    ownerIdx: 4, name: 'PayBridge', tagline: 'Instant, low-fee payouts for global freelancers', category: 'FinTech', stage: 'building', status: 'active', max_team_size: 6,
    description: 'PayBridge lets freelancers in emerging markets get paid by international clients in minutes instead of days, at a fraction of the usual fees.',
    requiredSkills: [['Node.js', 'required'], ['PostgreSQL', 'required'], ['Fundraising', 'nice_to_have'], ['Sales', 'nice_to_have']],
  },
  {
    ownerIdx: 10, name: 'QuestForge', tagline: 'Tooling for solo and small indie game studios', category: 'Gaming', stage: 'paused', status: 'paused', max_team_size: 5,
    description: 'QuestForge builds drag-and-drop quest and dialogue tools so small indie teams can ship narrative-heavy games faster.',
    requiredSkills: [['TypeScript', 'required'], ['Graphic Design', 'nice_to_have']],
  },
];

// user index helpers used below (0-based into USERS)
const [DEMO, PRIYA, RAHUL, ANANYA, KARAN, SNEHA, VIKRAM, NEHA, ARJUN, DIVYA, ROHIT, ISHITA, AMAN, MEERA, YASH, TANVI] = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
const NIMBUS = 0, GREENLOOP = 1, MEDISYNC = 2, EDUSPARK = 3, PAYBRIDGE = 4, QUESTFORGE = 5;

async function main() {
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    multipleStatements: true,
  });

  console.log(`→ Connected to ${env.db.database}@${env.db.host}:${env.db.port}`);

  // 1. Master lists (idempotent — same as database/seed.sql) ----------
  await conn.query(
    `INSERT INTO Skills (skill_name, category) VALUES ?
     AS new ON DUPLICATE KEY UPDATE category = new.category`,
    [SKILL_NAMES.map((n) => [n, skillCategory(n)])]
  );
  await conn.query(
    `INSERT INTO Interests (interest_name) VALUES ?
     AS new ON DUPLICATE KEY UPDATE interest_name = new.interest_name`,
    [INTEREST_NAMES.map((n) => [n])]
  );

  const [skillRows] = await conn.query('SELECT skill_id, skill_name FROM Skills');
  const [interestRows] = await conn.query('SELECT interest_id, interest_name FROM Interests');
  const skillId = Object.fromEntries(skillRows.map((r) => [r.skill_name, r.skill_id]));
  const interestId = Object.fromEntries(interestRows.map((r) => [r.interest_name, r.interest_id]));

  // 2. Wipe previously-seeded demo rows (children first) --------------
  console.log('→ Clearing existing demo data...');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of [
    'Notifications', 'SavedProfiles', 'Reviews', 'Milestones', 'ProjectMembers',
    'Projects', 'Applications', 'StartupRequiredSkills', 'StartupMembers',
    'Startups', 'UserInterests', 'UserSkills', 'Profiles', 'Users',
  ]) {
    await conn.query(`DELETE FROM ${table}`);
    await conn.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
  }
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  // 3. Users + Profiles + Skills + Interests ---------------------------
  console.log('→ Inserting users and profiles...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  const userIds = [];

  for (const u of USERS) {
    const [res] = await conn.query(
      `INSERT INTO Users (name, email, password_hash, auth_provider, avatar_url, user_role, status)
       VALUES (?, ?, ?, 'local', ?, ?, 'active')`,
      [u.name, u.email, passwordHash, avatarFor(u.name), u.role]
    );
    const userId = res.insertId;
    userIds.push(userId);

    await conn.query(
      `INSERT INTO Profiles
         (user_id, bio, primary_role, experience_level, availability_hours, startup_goal, profile_visibility, location, headline, linkedin_url, github_url)
       VALUES (?, ?, ?, ?, ?, ?, 'public', ?, ?, ?, ?)`,
      [userId, u.bio, u.primary_role, u.experience_level, u.availability_hours, u.startup_goal, u.location, u.headline, u.linkedin_url, u.github_url]
    );

    for (const [skillName, proficiency] of u.skills) {
      await conn.query(
        `INSERT INTO UserSkills (user_id, skill_id, proficiency_level) VALUES (?, ?, ?)`,
        [userId, skillId[skillName], proficiency]
      );
    }
    for (const interestName of u.interests) {
      await conn.query(`INSERT INTO UserInterests (user_id, interest_id) VALUES (?, ?)`, [userId, interestId[interestName]]);
    }
  }

  // 4. Startups + required skills (owner auto-added as Founder by trigger)
  console.log('→ Inserting startups...');
  const startupIds = [];
  for (const s of STARTUPS) {
    const [res] = await conn.query(
      `INSERT INTO Startups (owner_id, name, tagline, description, category, stage, status, max_team_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userIds[s.ownerIdx], s.name, s.tagline, s.description, s.category, s.stage, s.status, s.max_team_size]
    );
    startupIds.push(res.insertId);
    for (const [skillName, priority] of s.requiredSkills) {
      await conn.query(
        `INSERT INTO StartupRequiredSkills (startup_id, skill_id, priority) VALUES (?, ?, ?)`,
        [res.insertId, skillId[skillName], priority]
      );
    }
  }

  // 5. Applications --------------------------------------------------
  // Helper: insert a pending application row, return its id.
  async function insertApplication({ type, sender, receiver, startup = null, message, score }) {
    const [res] = await conn.query(
      `INSERT INTO Applications (type, sender_id, receiver_id, startup_id, message, compatibility_score, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [type, userIds[sender], userIds[receiver], startup === null ? null : startupIds[startup], message, score]
    );
    return res.insertId;
  }
  async function accept(applicationId, receiverIdx) {
    await conn.query('CALL sp_accept_application(?, ?)', [applicationId, userIds[receiverIdx]]);
  }
  async function reject(applicationId) {
    await conn.query(`UPDATE Applications SET status = 'rejected' WHERE application_id = ?`, [applicationId]);
  }

  console.log('→ Inserting applications (requests, startup applications, invitations)...');

  // Co-founder requests (person <-> person, no startup)
  const cf1 = await insertApplication({ type: 'cofounder_request', sender: DEMO, receiver: PRIYA, message: 'Loved your work at Swiggy — want to team up on FOUNDRX as a technical co-founder?', score: 82.5 });
  await accept(cf1, PRIYA);
  const cf2 = await insertApplication({ type: 'cofounder_request', sender: KARAN, receiver: ARJUN, message: 'Building a payments startup, would love a developer co-founder.', score: 41.0 });
  await reject(cf2);
  const cf3 = await insertApplication({ type: 'cofounder_request', sender: DIVYA, receiver: ROHIT, message: 'Working on an edtech idea, your backend experience would be huge.', score: 63.0 });
  // left pending
  const cf4 = await insertApplication({ type: 'cofounder_request', sender: MEERA, receiver: DEMO, message: 'I saw MediSync — I have a very similar idea and matching data background, want to combine forces?', score: 71.5 });
  // left pending

  // Startup applications (applicant -> owner)
  const sa1 = await insertApplication({ type: 'startup_application', sender: SNEHA, receiver: PRIYA, startup: NIMBUS, message: 'I would love to help build the NimbusAI frontend.', score: 58.0 });
  await accept(sa1, PRIYA);
  const sa2 = await insertApplication({ type: 'startup_application', sender: ARJUN, receiver: NEHA, startup: EDUSPARK, message: 'EduSpark sounds exactly like what I want to build — happy to join as a developer.', score: 55.0 });
  const sa3 = await insertApplication({ type: 'startup_application', sender: AMAN, receiver: KARAN, startup: PAYBRIDGE, message: 'I have run sales at a seed-stage SaaS company, would love to help PayBridge grow.', score: 47.5 });
  await accept(sa3, KARAN);
  const sa4 = await insertApplication({ type: 'startup_application', sender: ISHITA, receiver: VIKRAM, startup: GREENLOOP, message: 'GreenLoop needs better brand + UI — I can help with both.', score: 39.0 });
  await reject(sa4);
  const sa5 = await insertApplication({ type: 'startup_application', sender: YASH, receiver: ROHIT, startup: QUESTFORGE, message: 'Still a student but very keen to contribute to QuestForge.', score: 22.0 });
  // left pending

  // Team invitations (owner -> invitee)
  const ti1 = await insertApplication({ type: 'team_invitation', sender: DEMO, receiver: MEERA, startup: MEDISYNC, message: 'Your data engineering background is exactly what MediSync needs — join us?', score: 78.0 });
  await accept(ti1, MEERA);
  const ti2 = await insertApplication({ type: 'team_invitation', sender: DIVYA, receiver: TANVI, startup: EDUSPARK, message: 'We need marketing help for our launch, interested?', score: 30.0 });
  // left pending
  const ti3 = await insertApplication({ type: 'team_invitation', sender: KARAN, receiver: ROHIT, startup: PAYBRIDGE, message: 'We could use a strong backend engineer part-time — interested in PayBridge?', score: 66.5 });
  await reject(ti3);

  // 6. A few extra direct StartupMembers (already-settled teammates,
  //    not modeled as an application — e.g. co-founders who joined at
  //    founding time).
  console.log('→ Inserting additional startup members...');
  await conn.query(
    `INSERT INTO StartupMembers (startup_id, user_id, team_role) VALUES ?`,
    [[
      [startupIds[NIMBUS], userIds[RAHUL], 'ML Engineer'],
      [startupIds[GREENLOOP], userIds[NEHA], 'Growth Lead'],
    ]]
  );

  // 7. Projects + milestones -----------------------------------------
  console.log('→ Inserting projects and milestones...');
  const today = new Date();
  const daysFromNow = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const PROJECTS = [
    { startup: NIMBUS, title: 'Forecasting engine v1', description: 'Core demand-forecasting model and API.', status: 'in_progress',
      milestones: [
        { title: 'Data pipeline from Shopify/CSV imports', status: 'completed', due_date: daysFromNow(-30) },
        { title: 'Baseline forecasting model', status: 'completed', due_date: daysFromNow(-10) },
        { title: 'Forecast accuracy dashboard', status: 'in_progress', due_date: daysFromNow(7) },
        { title: 'Public API + docs', status: 'not_started', due_date: daysFromNow(21) },
      ] },
    { startup: NIMBUS, title: 'Landing page + waitlist', description: 'Marketing site to start collecting design partners.', status: 'completed',
      milestones: [
        { title: 'Landing page design', status: 'completed', due_date: daysFromNow(-45) },
        { title: 'Ship + collect first 100 signups', status: 'completed', due_date: daysFromNow(-25) },
      ] },
    { startup: MEDISYNC, title: 'Referral timeline MVP', description: 'Shared patient timeline across referring clinics.', status: 'in_progress',
      milestones: [
        { title: 'Clinic + patient data model', status: 'completed', due_date: daysFromNow(-20) },
        { title: 'Referral timeline UI', status: 'in_progress', due_date: daysFromNow(5) },
        { title: 'Pilot with 2 partner clinics', status: 'not_started', due_date: daysFromNow(30) },
      ] },
    { startup: GREENLOOP, title: 'Supplier-buyer marketplace MVP', description: 'Core listing + matching flow between recyclers and manufacturers.', status: 'planning',
      milestones: [
        { title: 'Supplier onboarding flow', status: 'not_started', due_date: daysFromNow(14) },
        { title: 'Buyer search + RFQ flow', status: 'not_started', due_date: daysFromNow(28) },
      ] },
    { startup: PAYBRIDGE, title: 'Payout rails integration', description: 'Integrate first cross-border payout provider.', status: 'in_progress',
      milestones: [
        { title: 'KYC + compliance review', status: 'completed', due_date: daysFromNow(-15) },
        { title: 'Provider integration (sandbox)', status: 'in_progress', due_date: daysFromNow(3) },
        { title: 'First live payout', status: 'not_started', due_date: daysFromNow(-2) }, // overdue, on purpose
      ] },
    { startup: EDUSPARK, title: 'Micro-lesson prototype', description: 'First clickable prototype of the 5-minute lesson flow.', status: 'planning',
      milestones: [
        { title: 'Content format research', status: 'in_progress', due_date: daysFromNow(10) },
      ] },
  ];

  for (const p of PROJECTS) {
    const [res] = await conn.query(
      `INSERT INTO Projects (startup_id, title, description, status) VALUES (?, ?, ?, ?)`,
      [startupIds[p.startup], p.title, p.description, p.status]
    );
    const projectId = res.insertId;
    for (const m of p.milestones) {
      await conn.query(
        `INSERT INTO Milestones (project_id, title, due_date, status) VALUES (?, ?, ?, ?)`,
        [projectId, m.title, m.due_date, m.status]
      );
    }
  }

  // ProjectMembers: put each startup's current active members onto its
  // first project (simplest realistic mapping for a demo dataset).
  const [projectRows] = await conn.query('SELECT project_id, startup_id FROM Projects ORDER BY project_id');
  const firstProjectByStartup = {};
  for (const row of projectRows) {
    if (!(row.startup_id in firstProjectByStartup)) firstProjectByStartup[row.startup_id] = row.project_id;
  }
  const [memberRows] = await conn.query(`SELECT startup_id, user_id, team_role FROM StartupMembers WHERE member_status = 'active'`);
  for (const row of memberRows) {
    const projectId = firstProjectByStartup[row.startup_id];
    if (!projectId) continue;
    await conn.query(
      `INSERT INTO ProjectMembers (project_id, user_id, project_role) VALUES (?, ?, ?)`,
      [projectId, row.user_id, row.team_role]
    );
  }

  // 8. Reviews (post-collaboration feedback) ---------------------------
  console.log('→ Inserting reviews...');
  await conn.query(
    `INSERT INTO Reviews (reviewer_id, reviewed_id, startup_id, rating, comment) VALUES ?`,
    [[
      [userIds[PRIYA], userIds[SNEHA], startupIds[NIMBUS], 5, 'Sneha shipped the dashboard redesign faster than we scoped — great communicator too.'],
      [userIds[SNEHA], userIds[PRIYA], startupIds[NIMBUS], 5, 'Priya gave me real ownership from day one. Learned a ton.'],
      [userIds[DEMO], userIds[MEERA], startupIds[MEDISYNC], 4, 'Meera\'s data model held up well as we scoped the pilot. Would work together again.'],
      [userIds[MEERA], userIds[DEMO], startupIds[MEDISYNC], 5, 'Clear product direction and fast decisions — exactly what an early team needs.'],
      [userIds[KARAN], userIds[AMAN], startupIds[PAYBRIDGE], 4, 'Aman closed our first two pilot customers within three weeks.'],
    ]]
  );

  // 9. Saved profiles (bookmarks) ---------------------------------------
  console.log('→ Inserting saved profiles...');
  await conn.query(
    `INSERT IGNORE INTO SavedProfiles (user_id, saved_user_id) VALUES ?`,
    [[
      [userIds[DEMO], userIds[ROHIT]],
      [userIds[DEMO], userIds[ISHITA]],
      [userIds[PRIYA], userIds[ARJUN]],
      [userIds[KARAN], userIds[DIVYA]],
      [userIds[VIKRAM], userIds[NEHA]],
      [userIds[DIVYA], userIds[ROHIT]],
    ]]
  );

  // 10. A couple of plain "system" notifications, e.g. a welcome message
  console.log('→ Inserting a few system notifications...');
  await conn.query(
    `INSERT INTO Notifications (user_id, type, message) VALUES ?`,
    [userIds.map((id) => [id, 'system', 'Welcome to FOUNDRX! Complete your profile to start matching with co-founders.'])]
  );

  await conn.end();

  console.log('\n✔ Demo data seeded successfully.\n');
  console.log('Log in as any seeded user with the shared demo password:');
  console.log(`  Password: ${DEMO_PASSWORD}\n`);
  console.log('Suggested account to demo with (admin + startup owner):');
  console.log(`  ${USERS[DEMO].email}\n`);
  console.log('All seeded emails:');
  USERS.forEach((u) => console.log(`  - ${u.email}${u.role === 'admin' ? '  (admin)' : ''}`));
}

function skillCategory(name) {
  const categories = {
    React: 'frontend', JavaScript: 'frontend', TypeScript: 'frontend',
    'Node.js': 'backend', Express: 'backend', Python: 'backend',
    MySQL: 'database', PostgreSQL: 'database', MongoDB: 'database',
    'UI/UX Design': 'design', Figma: 'design', 'Graphic Design': 'design',
    'Product Management': 'product', 'Growth Marketing': 'marketing', SEO: 'marketing',
    Sales: 'business', Fundraising: 'business', 'Data Analysis': 'data',
    'Machine Learning': 'data', DevOps: 'infra',
  };
  return categories[name] || 'general';
}

function avatarFor(name) {
  const seed = encodeURIComponent(name.replace(/\s+/g, ''));
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
}

main().catch((err) => {
  console.error('✘ Demo data seed failed:', err);
  process.exit(1);
});
