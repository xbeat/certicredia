# Fix: Specialist Profile Not Found Error

## Problem

When a user with role `specialist` tries to access their dashboard (`/public/pages/specialist/dashboard.html`), they get an error:

```
Specialist profile not found
```

This happens even though the user exists in the database and has the correct role.

## Root Cause

The issue occurs because:

1. The specialist user exists in the `users` table with `role = 'specialist'`
2. However, there is **no corresponding entry** in the `specialist_profiles` table
3. The dashboard query in `/modules/specialists/services/specialistService.js` uses an **INNER JOIN** between `users` and `specialist_profiles`:

```sql
SELECT sp.*, u.name, u.email
FROM specialist_profiles sp
JOIN users u ON sp.user_id = u.id
WHERE sp.user_id = $1
```

4. If no row exists in `specialist_profiles`, the query returns **0 rows** → error is thrown

This is similar to the organization_users issue - users can have a role but lack the required associated profile.

## When Does This Happen?

This issue typically occurs when:

- Specialists are created manually via SQL or admin panel without creating the profile
- The `seedDemoUsers.js` script creates specialist users but doesn't create profiles
- User registration creates the user but fails to create the profile
- Database migrations don't properly backfill existing specialist users

## Solution

Two scripts are provided to diagnose and fix this issue:

### 1. Verify (Diagnostic)

```bash
node scripts/verify-specialist-profiles.js
```

**What it does:**
- Lists all users with `role = 'specialist'`
- Shows which specialists have profiles
- **Identifies orphaned specialists** (users without profiles)
- Displays profile status for existing specialists

**Example output:**
```
⚠️  UTENTI SPECIALIST SENZA PROFILE (2):
❌ specialist1@example.com      (ID:  15) - Mario Rossi
   Created: 2024-01-15
❌ specialist2@example.com      (ID:  18) - Laura Bianchi
   Created: 2024-01-20

💡 SOLUZIONE:
   Esegui: node scripts/fix-specialist-profiles.js
```

### 2. Fix (Automatic Repair)

```bash
node scripts/fix-specialist-profiles.js
```

**What it does:**
- Finds all specialist users without profiles
- **Automatically creates** a `specialist_profiles` entry for each orphaned specialist
- Uses safe transaction handling (ROLLBACK on error)
- Sets default values:
  - `status = 'candidate'` (can be updated later by admin)
  - `exam_passed = false`
  - `exam_attempts = 0`
  - `experience_years = 0`
  - `cpe_hours_current_year = 0`
  - `cpe_compliant = true`

**Example output:**
```
✅ Fix Completato!
   ✓ Profiles creati: 2

📊 Statistiche Finali:
   Total Specialist Profiles: 5
   Active: 2
   Candidates: 3
   Exam Passed: 1

📝 Prossimi passi:
  1. Gli specialist possono ora accedere alla dashboard
  2. L'admin può aggiornare lo status da 'candidate' ad 'active'
  3. Gli specialist possono completare il profilo con qualifiche e CV
```

## Manual Fix (SQL)

If you prefer to fix manually, run this SQL for each orphaned specialist:

```sql
-- Replace 123 with the actual user_id
INSERT INTO specialist_profiles
  (user_id, status, exam_attempts, exam_passed, experience_years, cpe_hours_current_year, cpe_hours_total, cpe_compliant)
VALUES
  (123, 'candidate', 0, false, 0, 0, 0, true);
```

## Prevention

To prevent this issue in the future:

### 1. Update seed scripts

Ensure `scripts/seedDemoUsers.js` creates specialist profiles:

```javascript
// After creating specialist user
const userResult = await client.query(
  `INSERT INTO users (email, password_hash, name, role, ...) VALUES (...)
   RETURNING id`
);

const userId = userResult.rows[0].id;

// CREATE THE PROFILE!
await client.query(
  `INSERT INTO specialist_profiles (user_id, status, exam_attempts, exam_passed, ...)
   VALUES ($1, 'candidate', 0, false, ...)`,
  [userId]
);
```

### 2. Update registration flow

In `/modules/specialists/services/specialistService.js`:

```javascript
export const registerSpecialistCandidate = async (userData) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, role, ...)
       VALUES ($1, $2, $3, 'specialist', ...) RETURNING id`,
      [...]
    );

    const userId = userResult.rows[0].id;

    // 2. ALWAYS create specialist profile
    await client.query(
      `INSERT INTO specialist_profiles (user_id, status, ...)
       VALUES ($1, 'candidate', ...)`,
      [userId]
    );

    await client.query('COMMIT');
    return userResult.rows[0];

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
```

### 3. Add database constraint

Consider adding a database trigger or constraint to ensure every specialist user has a profile:

```sql
-- Option 1: Trigger (auto-creates profile when specialist user is created)
CREATE OR REPLACE FUNCTION create_specialist_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'specialist' THEN
    INSERT INTO specialist_profiles (user_id, status, exam_attempts, exam_passed, cpe_compliant)
    VALUES (NEW.id, 'candidate', 0, false, true);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_specialist_profile
AFTER INSERT ON users
FOR EACH ROW
WHEN (NEW.role = 'specialist')
EXECUTE FUNCTION create_specialist_profile();
```

## Verification

After running the fix:

1. **Check the database:**
   ```bash
   node scripts/verify-specialist-profiles.js
   ```
   Should show: ✅ TUTTO OK!

2. **Test login:**
   - Login as specialist user
   - Dashboard should load without errors
   - Profile information should be visible (even if minimal)

3. **Update profiles:**
   - Admin can update specialist status from 'candidate' to 'active'
   - Specialists can complete their profiles with qualifications, CV, etc.

## Technical Details

### Database Schema

```sql
CREATE TABLE specialist_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'candidate',
  exam_attempts INTEGER DEFAULT 0,
  exam_passed BOOLEAN DEFAULT false,
  exam_score DECIMAL(5, 2),
  exam_passed_at TIMESTAMP,
  qualifications TEXT[],
  certifications TEXT[],
  experience_years INTEGER,
  bio TEXT,
  cv_url TEXT,
  linkedin_url VARCHAR(500),
  cpe_hours_current_year DECIMAL(10, 2) DEFAULT 0,
  cpe_hours_total DECIMAL(10, 2) DEFAULT 0,
  cpe_last_check_date DATE,
  cpe_compliant BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);
```

### Query That Fails

File: `/modules/specialists/services/specialistService.js:411-436`

```javascript
export const getSpecialistDashboard = async (userId) => {
  const result = await pool.query(
    `SELECT sp.*, u.name, u.email, ...
     FROM specialist_profiles sp
     JOIN users u ON sp.user_id = u.id
     WHERE sp.user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Specialist profile not found'); // ← THIS ERROR
  }

  return result.rows[0];
};
```

## Related Issues

- Similar to the `organization_users` issue (see `docs/FIX_ORGANIZATION_USERS.md`)
- Both issues stem from incomplete multi-table user role architecture

## Support

For issues or questions:
- File issue: https://github.com/anthropics/certicredia/issues
- Check logs: Server console will show the exact error from `specialistService.js`
