# 🚀 Quick Start - Setup Database

## One-Command Setup

### Local Database
```bash
./setup-all.sh local
```

### Remote Database (Neon/Cloud)
```bash
./setup-all.sh remote
```

### Custom DATABASE_URL
```bash
DATABASE_URL='postgresql://user:pass@host/db?sslmode=require' ./setup-all.sh
```

## What It Does

1. ✅ Creates main database tables (users, products, orders)
2. ✅ Creates CPF auditing tables
3. ✅ Seeds demo users (admin, specialist, org_admin, user)
4. ✅ Seeds organizations and demo data
5. ✅ Generates CPF assessment data for all orgs
6. ⚠️  (Optional) Assigns specialists to organizations
7. ⚠️  (Optional) Creates demo orders

## Demo Credentials

After setup, login with:

| Email | Password | Role |
|-------|----------|------|
| admin@certicredia.test | Admin123!@# | admin |
| specialist@certicredia.test | Specialist123!@# | specialist |
| organization@certicredia.test | Org123!@# | organization_admin |
| user@certicredia.test | User123!@# | user |

## Manual Setup

If you prefer manual control:

```bash
# 1. Main database
node scripts/setup-database.js

# 2. CPF auditing (local)
node scripts/setup-cpf-auditing-db.js

# 2. CPF auditing (remote)
DATABASE_URL='...' node scripts/setup-cpf-auditing-db.js

# 3. Demo users
node scripts/seedDemoUsers.js

# 4. Demo data
node scripts/seedEnhancedDemoData.js

# 5. CPF data (local)
node scripts/generate-all-cpf-data.js

# 5. CPF data (remote)
DATABASE_URL='...' node scripts/generate-all-cpf-data.js
```

## Environment Variables

### Local Database (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=certicredia
DB_USER=postgres
DB_PASSWORD=your_password
```

### Remote Database (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

## Next Steps

```bash
# Start server
npm start

# Access admin panel
open http://localhost:3000/admin

# Login with admin@certicredia.test
```

## Troubleshooting

### Permission Errors
```bash
# Re-run setup to fix permissions
./setup-all.sh local
```

### Remote Connection Issues
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
DATABASE_URL='...' node scripts/setup-cpf-auditing-db.js
```

### Reset Everything
```bash
# ⚠️  WARNING: Deletes all data!
./reset-db.sh
./setup-all.sh local
```
