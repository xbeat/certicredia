#!/bin/bash

# ============================================================================
# CERTICREDIA - Database Setup Master Script
# ============================================================================
# Usage:
#   ./setup-all.sh local              # Use local DB from .env
#   ./setup-all.sh remote             # Use DATABASE_URL from .env
#   DATABASE_URL='...' ./setup-all.sh # Override DATABASE_URL
# ============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Database type
DB_TYPE=${1:-local}

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     CERTICREDIA - Complete Database Setup                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

if [ "$DB_TYPE" = "remote" ]; then
    echo -e "${YELLOW}🌐 MODE: REMOTE DATABASE (using DATABASE_URL)${NC}"
    if [ -z "$DATABASE_URL" ]; then
        # Load from .env
        if [ -f .env ]; then
            export $(cat .env | grep DATABASE_URL | xargs)
        fi
        if [ -z "$DATABASE_URL" ]; then
            echo -e "${RED}❌ ERROR: DATABASE_URL not found in environment or .env${NC}"
            echo "Set it with: export DATABASE_URL='postgresql://...'"
            exit 1
        fi
    fi
    echo -e "${GREEN}✓ DATABASE_URL configured${NC}\n"
else
    echo -e "${YELLOW}🏠 MODE: LOCAL DATABASE (using .env variables)${NC}"
    if [ ! -f .env ]; then
        echo -e "${RED}❌ ERROR: .env file not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ .env file found${NC}\n"
fi

# Function to run script
run_script() {
    local script=$1
    local name=$2
    local use_db_url=$3

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}▶ $name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [ "$use_db_url" = "yes" ] && [ ! -z "$DATABASE_URL" ]; then
        DATABASE_URL="$DATABASE_URL" node "$script"
    else
        node "$script"
    fi

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ SUCCESS${NC}\n"
    else
        echo -e "${RED}✗ FAILED${NC}\n"
        exit 1
    fi
}

# ============================================================================
# STEP 1: Main Database Setup
# ============================================================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  STEP 1: Main Database & Tables${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}\n"

run_script "scripts/setup-database.js" "Setup main database (users, products, orders)" "no"

# ============================================================================
# STEP 2: CPF Auditing Setup
# ============================================================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  STEP 2: CPF Auditing Tables${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}\n"

if [ "$DB_TYPE" = "remote" ]; then
    run_script "scripts/setup-cpf-auditing-db.js" "Setup CPF auditing tables" "yes"
else
    run_script "scripts/setup-cpf-auditing-db.js" "Setup CPF auditing tables" "no"
fi

# ============================================================================
# STEP 3: Seed Demo Users
# ============================================================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  STEP 3: Demo Users${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}\n"

run_script "scripts/seedDemoUsers.js" "Create demo users (admin, specialist, org_admin)" "no"

# ============================================================================
# STEP 4: Seed Enhanced Demo Data
# ============================================================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  STEP 4: Organizations & Demo Data${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}\n"

run_script "scripts/seedEnhancedDemoData.js" "Create organizations and demo data" "no"

# ============================================================================
# STEP 5: Generate CPF Assessment Data
# ============================================================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  STEP 5: CPF Assessment Data${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}\n"

if [ "$DB_TYPE" = "remote" ]; then
    run_script "scripts/generate-all-cpf-data.js" "Generate CPF assessments for all organizations" "yes"
else
    run_script "scripts/generate-all-cpf-data.js" "Generate CPF assessments for all organizations" "no"
fi

# ============================================================================
# OPTIONAL: Specialist Assignments
# ============================================================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  OPTIONAL: Specialist Assignments${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}\n"

if [ -f "scripts/seedSpecialistAssignments.js" ]; then
    read -p "$(echo -e ${CYAN}Assign specialists to organizations? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_script "scripts/seedSpecialistAssignments.js" "Assign specialists to organizations" "no"
    else
        echo -e "${YELLOW}⏭️  Skipped${NC}\n"
    fi
fi

# ============================================================================
# OPTIONAL: Orders
# ============================================================================
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  OPTIONAL: Demo Orders${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}\n"

if [ -f "scripts/seedOrders.js" ]; then
    read -p "$(echo -e ${CYAN}Create demo orders? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_script "scripts/seedOrders.js" "Create demo orders" "no"
    else
        echo -e "${YELLOW}⏭️  Skipped${NC}\n"
    fi
fi

# ============================================================================
# DONE
# ============================================================================
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  ✅ SETUP COMPLETE!                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}📝 Next steps:${NC}"
echo -e "  ${GREEN}1.${NC} Start server: ${YELLOW}npm start${NC}"
echo -e "  ${GREEN}2.${NC} Access admin: ${YELLOW}http://localhost:3000/admin${NC}"
echo -e "  ${GREEN}3.${NC} Login with:   ${YELLOW}admin@certicredia.test / Admin123!@#${NC}"
echo ""
echo -e "${CYAN}📊 Demo Users Created:${NC}"
echo -e "  ${YELLOW}admin@certicredia.test${NC}        (Admin123!@#)"
echo -e "  ${YELLOW}specialist@certicredia.test${NC}   (Specialist123!@#)"
echo -e "  ${YELLOW}organization@certicredia.test${NC} (Org123!@#)"
echo -e "  ${YELLOW}user@certicredia.test${NC}         (User123!@#)"
echo ""
