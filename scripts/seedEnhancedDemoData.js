import { pool } from '../server/config/database.js';
import pkg from 'bcrypt';
const { hash } = pkg;
import logger from '../server/utils/logger.js';

const SALT_ROUNDS = 4;  // Low for demo speed

async function seedEnhancedDemoData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🌱 Seeding enhanced demo data...\n');

    // ========================================
    // 1. USERS (40 utenti variati)
    // ========================================
    console.log('👤 Creating users...');

    const usersData = [
      // Admins
      { email: 'admin@certicredia.it', password: 'Admin123', name: 'Marco Bianchi', role: 'admin', company: 'CertiCredia Italia' },
      { email: 'admin2@certicredia.it', password: 'Admin123', name: 'Laura Verdi', role: 'admin', company: 'CertiCredia Italia' },

      // Organization Admins
      { email: 'admin@techcorp.it', password: 'Password123', name: 'Giovanni Rossi', role: 'organization_admin', company: 'TechCorp S.p.A.' },
      { email: 'admin@financebank.it', password: 'Password123', name: 'Maria Neri', role: 'organization_admin', company: 'Finance Bank' },
      { email: 'admin@healthsys.it', password: 'Password123', name: 'Paolo Gialli', role: 'organization_admin', company: 'HealthSys Italia' },
      { email: 'admin@retailgroup.it', password: 'Password123', name: 'Francesca Blu', role: 'organization_admin', company: 'Retail Group' },
      { email: 'admin@energyplus.it', password: 'Password123', name: 'Andrea Viola', role: 'organization_admin', company: 'Energy Plus' },

      // Specialists
      { email: 'specialist1@certicredia.it', password: 'Specialist123', name: 'Dr. Roberto Ferrari', role: 'specialist', company: null },
      { email: 'specialist2@certicredia.it', password: 'Specialist123', name: 'Dr. Elena Russo', role: 'specialist', company: null },
      { email: 'specialist3@certicredia.it', password: 'Specialist123', name: 'Dr. Luca Romano', role: 'specialist', company: null },
      { email: 'specialist4@certicredia.it', password: 'Specialist123', name: 'Dr. Chiara Colombo', role: 'specialist', company: null },
      { email: 'specialist5@certicredia.it', password: 'Specialist123', name: 'Dr. Alessandro Ricci', role: 'specialist', company: null },

      // Regular users (clienti vari)
      { email: 'mario.rossi@techcorp.it', password: 'Password123', name: 'Mario Rossi', role: 'user', company: 'TechCorp S.p.A.' },
      { email: 'giulia.bianchi@financebank.it', password: 'Password123', name: 'Giulia Bianchi', role: 'user', company: 'Finance Bank' },
      { email: 'luca.verdi@healthsys.it', password: 'Password123', name: 'Luca Verdi', role: 'user', company: 'HealthSys Italia' },
      { email: 'anna.ferrari@retailgroup.it', password: 'Password123', name: 'Anna Ferrari', role: 'user', company: 'Retail Group' },
      { email: 'marco.russo@energyplus.it', password: 'Password123', name: 'Marco Russo', role: 'user', company: 'Energy Plus' },
      { email: 'sara.colombo@startup.it', password: 'Password123', name: 'Sara Colombo', role: 'user', company: 'StartupInnovation' },
      { email: 'davide.rizzo@consulting.it', password: 'Password123', name: 'Davide Rizzo', role: 'user', company: 'RizzoConsulting' },
      { email: 'elena.marino@cloud.it', password: 'Password123', name: 'Elena Marino', role: 'user', company: 'CloudService SRL' },
      { email: 'fabio.greco@datatech.it', password: 'Password123', name: 'Fabio Greco', role: 'user', company: 'DataTech Italia' },
      { email: 'silvia.costa@security.it', password: 'Password123', name: 'Silvia Costa', role: 'user', company: 'SecurityFirst' },
      { email: 'roberto.villa@network.it', password: 'Password123', name: 'Roberto Villa', role: 'user', company: 'NetworkSolutions' },
      { email: 'martina.conti@mobile.it', password: 'Password123', name: 'Martina Conti', role: 'user', company: 'MobileApps Ltd' },
      { email: 'andrea.bruno@ai.it', password: 'Password123', name: 'Andrea Bruno', role: 'user', company: 'AI Innovations' },
      { email: 'chiara.gallo@blockchain.it', password: 'Password123', name: 'Chiara Gallo', role: 'user', company: 'BlockChain Italia' },
      { email: 'stefano.riva@iot.it', password: 'Password123', name: 'Stefano Riva', role: 'user', company: 'IoT Systems' },
      { email: 'valentina.moretti@saas.it', password: 'Password123', name: 'Valentina Moretti', role: 'user', company: 'SaaS Provider' },
      { email: 'michele.lombardi@ecommerce.it', password: 'Password123', name: 'Michele Lombardi', role: 'user', company: 'E-Commerce Pro' },
      { email: 'federica.ferrari@marketing.it', password: 'Password123', name: 'Federica Ferrari', role: 'user', company: 'Digital Marketing' },
      { email: 'giuseppe.esposito@logistics.it', password: 'Password123', name: 'Giuseppe Esposito', role: 'user', company: 'Logistics Corp' },
      { email: 'alessia.romano@hr.it', password: 'Password123', name: 'Alessia Romano', role: 'user', company: 'HR Solutions' },
      { email: 'simone.pagano@legal.it', password: 'Password123', name: 'Simone Pagano', role: 'user', company: 'Legal Tech' },
      { email: 'beatrice.de.luca@finance.it', password: 'Password123', name: 'Beatrice De Luca', role: 'user', company: 'FinTech Innovators' },
      { email: 'daniele.mariani@travel.it', password: 'Password123', name: 'Daniele Mariani', role: 'user', company: 'Travel Platform' },
      { email: 'laura.serra@education.it', password: 'Password123', name: 'Laura Serra', role: 'user', company: 'EduTech Solutions' },
      { email: 'antonio.santoro@gaming.it', password: 'Password123', name: 'Antonio Santoro', role: 'user', company: 'Gaming Studio' },
      { email: 'monica.pellegrini@media.it', password: 'Password123', name: 'Monica Pellegrini', role: 'user', company: 'Media Group' },
      { email: 'francesco.fontana@sport.it', password: 'Password123', name: 'Francesco Fontana', role: 'user', company: 'SportsTech' },
      { email: 'cristina.barbieri@pharma.it', password: 'Password123', name: 'Cristina Barbieri', role: 'user', company: 'PharmaTech' },
      { email: 'lorenzo.vitali@agriculture.it', password: 'Password123', name: 'Lorenzo Vitali', role: 'user', company: 'AgriTech Solutions' }
    ];

    const userIds = {};
    for (const userData of usersData) {
      const passwordHash = await hash(userData.password, SALT_ROUNDS);
      const result = await client.query(
        `INSERT INTO users (email, password_hash, name, role, company, active, email_verified)
         VALUES ($1, $2, $3, $4, $5, true, true)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [userData.email, passwordHash, userData.name, userData.role, userData.company]
      );
      userIds[userData.email] = result.rows[0].id;
    }

    console.log(`✅ Created ${usersData.length} users`);

    // ========================================
    // 2. ORGANIZATIONS (20 organizzazioni)
    // ========================================
    console.log('\n🏢 Creating organizations...');

    const organizationsData = [
      { name: 'TechCorp S.p.A.', type: 'PRIVATE_COMPANY', vat: 'IT12345678901', city: 'Milano', adminEmail: 'admin@techcorp.it' },
      { name: 'Finance Bank Italia', type: 'PRIVATE_COMPANY', vat: 'IT98765432109', city: 'Roma', adminEmail: 'admin@financebank.it' },
      { name: 'HealthSys Italia', type: 'PRIVATE_COMPANY', vat: 'IT11223344556', city: 'Torino', adminEmail: 'admin@healthsys.it' },
      { name: 'Retail Group SpA', type: 'PRIVATE_COMPANY', vat: 'IT66778899001', city: 'Bologna', adminEmail: 'admin@retailgroup.it' },
      { name: 'Energy Plus SRL', type: 'PRIVATE_COMPANY', vat: 'IT55443322110', city: 'Napoli', adminEmail: 'admin@energyplus.it' },
      { name: 'Ministero della Difesa', type: 'PUBLIC_ENTITY', vat: 'IT00000000001', city: 'Roma', adminEmail: 'admin@techcorp.it' },
      { name: 'Regione Lombardia', type: 'PUBLIC_ENTITY', vat: 'IT11111111112', city: 'Milano', adminEmail: 'admin@techcorp.it' },
      { name: 'Università di Bologna', type: 'NON_PROFIT', vat: 'IT22222222223', city: 'Bologna', adminEmail: 'admin@techcorp.it' },
      { name: 'Croce Rossa Italiana', type: 'NON_PROFIT', vat: 'IT33333333334', city: 'Roma', adminEmail: 'admin@techcorp.it' },
      { name: 'StartupInnovation SRL', type: 'PRIVATE_COMPANY', vat: 'IT44444444445', city: 'Milano', adminEmail: 'admin@techcorp.it' },
      { name: 'CloudService SRL', type: 'PRIVATE_COMPANY', vat: 'IT55555555556', city: 'Firenze', adminEmail: 'admin@techcorp.it' },
      { name: 'DataTech Italia', type: 'PRIVATE_COMPANY', vat: 'IT66666666667', city: 'Genova', adminEmail: 'admin@techcorp.it' },
      { name: 'SecurityFirst SpA', type: 'PRIVATE_COMPANY', vat: 'IT77777777778', city: 'Venezia', adminEmail: 'admin@techcorp.it' },
      { name: 'NetworkSolutions', type: 'PRIVATE_COMPANY', vat: 'IT88888888889', city: 'Palermo', adminEmail: 'admin@techcorp.it' },
      { name: 'AI Innovations SRL', type: 'PRIVATE_COMPANY', vat: 'IT99999999990', city: 'Bari', adminEmail: 'admin@techcorp.it' },
      { name: 'BlockChain Italia', type: 'PRIVATE_COMPANY', vat: 'IT10101010101', city: 'Catania', adminEmail: 'admin@techcorp.it' },
      { name: 'IoT Systems SpA', type: 'PRIVATE_COMPANY', vat: 'IT20202020202', city: 'Verona', adminEmail: 'admin@techcorp.it' },
      { name: 'Digital Marketing SRL', type: 'PRIVATE_COMPANY', vat: 'IT30303030303', city: 'Padova', adminEmail: 'admin@techcorp.it' },
      { name: 'FinTech Innovators', type: 'PRIVATE_COMPANY', vat: 'IT40404040404', city: 'Trieste', adminEmail: 'admin@techcorp.it' },
      { name: 'PharmaTech Italia', type: 'PRIVATE_COMPANY', vat: 'IT50505050505', city: 'Parma', adminEmail: 'admin@techcorp.it' }
    ];

    const orgIds = {};
    for (const org of organizationsData) {
      const result = await client.query(
        `INSERT INTO organizations (name, organization_type, vat_number, address, city, postal_code, country, status, email)
         VALUES ($1, $2, $3, $4, $5, $6, 'IT', 'active', $7)
         RETURNING id`,
        [org.name, org.type, org.vat, `Via ${org.name} 123`, org.city, '00100', org.adminEmail]
      );
      orgIds[org.name] = result.rows[0].id;

      // Assegna admin all'organizzazione
      await client.query(
        `INSERT INTO organization_users (organization_id, user_id, role)
         VALUES ($1, $2, 'admin')
         ON CONFLICT DO NOTHING`,
        [result.rows[0].id, userIds[org.adminEmail]]
      );
    }

    console.log(`✅ Created ${organizationsData.length} organizations`);

    // ========================================
    // 3. PRODUCTS (15 prodotti/certificazioni)
    // ========================================
    console.log('\n📦 Creating products...');

    const productsData = [
      { name: 'ISO 27001 Lead Implementer', slug: 'iso-27001-lead-implementer', category: 'ISO', price: 2500, duration: '5 giorni' },
      { name: 'ISO 27001 Lead Auditor', slug: 'iso-27001-lead-auditor', category: 'ISO', price: 2800, duration: '5 giorni' },
      { name: 'CISSP - Certified Information Systems Security Professional', slug: 'cissp', category: 'ISC2', price: 3500, duration: '40 ore' },
      { name: 'CISM - Certified Information Security Manager', slug: 'cism', category: 'ISACA', price: 3200, duration: '32 ore' },
      { name: 'CEH - Certified Ethical Hacker', slug: 'ceh', category: 'EC-Council', price: 2900, duration: '5 giorni' },
      { name: 'CompTIA Security+', slug: 'comptia-security-plus', category: 'CompTIA', price: 1800, duration: '5 giorni' },
      { name: 'GDPR Data Protection Officer', slug: 'gdpr-dpo', category: 'Privacy', price: 2200, duration: '3 giorni' },
      { name: 'Penetration Testing Professional', slug: 'penetration-testing', category: 'Security', price: 3000, duration: '5 giorni' },
      { name: 'Cloud Security Specialist', slug: 'cloud-security', category: 'Cloud', price: 2700, duration: '4 giorni' },
      { name: 'SOC Analyst Training', slug: 'soc-analyst', category: 'Security', price: 2400, duration: '5 giorni' },
      { name: 'Incident Response Handler', slug: 'incident-response', category: 'Security', price: 2600, duration: '4 giorni' },
      { name: 'Digital Forensics Examiner', slug: 'digital-forensics', category: 'Forensics', price: 3100, duration: '5 giorni' },
      { name: 'Malware Analysis Professional', slug: 'malware-analysis', category: 'Security', price: 2800, duration: '4 giorni' },
      { name: 'Network Security Engineer', slug: 'network-security', category: 'Network', price: 2500, duration: '5 giorni' },
      { name: 'Blockchain Security Expert', slug: 'blockchain-security', category: 'Blockchain', price: 3300, duration: '4 giorni' }
    ];

    const productIds = [];
    for (const product of productsData) {
      const result = await client.query(
        `INSERT INTO products (name, slug, description, price, category, active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (slug) DO UPDATE SET price = EXCLUDED.price
         RETURNING id`,
        [
          product.name,
          product.slug,
          `Certificazione professionale ${product.name}. Corso completo con esame finale.`,
          product.price,
          product.category
        ]
      );
      productIds.push(result.rows[0].id);
    }

    console.log(`✅ Created ${productsData.length} products`);

    // ========================================
    // 4. ORDERS (50 ordini)
    // ========================================
    console.log('\n🛒 Creating orders...');

    const statuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
    const orderCount = 50;

    for (let i = 0; i < orderCount; i++) {
      const randomUser = usersData[Math.floor(Math.random() * usersData.length)];
      const userId = userIds[randomUser.email];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const daysAgo = Math.floor(Math.random() * 90);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      const orderNumber = `ORD-${Date.now()}-${i}`;
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, order_number, billing_name, billing_email, billing_address, billing_city, billing_postal_code, billing_country, subtotal_amount, total_amount, status, payment_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Italia', 0, 0, $8, 'pending', $9)
         RETURNING id`,
        [
          userId,
          orderNumber,
          randomUser.name || 'Test User',
          randomUser.email,
          `Via ${randomUser.company || 'Test'} ${Math.floor(Math.random() * 200)}`,
          randomUser.company ? randomUser.company.split(' ')[0] : 'Milano',
          '00100',
          status,
          orderDate
        ]
      );

      const orderId = orderResult.rows[0].id;

      // Aggiungi 1-3 prodotti per ordine
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      let totalAmount = 0;

      for (let j = 0; j < itemsCount; j++) {
        const randomProduct = Math.floor(Math.random() * productIds.length);
        const productId = productIds[randomProduct];
        const quantity = 1;
        const unitPrice = productsData[randomProduct].price;
        const totalPrice = unitPrice * quantity;

        await client.query(
          `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, total_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [orderId, productId, productsData[randomProduct].name, unitPrice, quantity, totalPrice]
        );

        totalAmount += totalPrice;
      }

      // Aggiorna totale ordine
      await client.query(
        `UPDATE orders SET total_amount = $1 WHERE id = $2`,
        [totalAmount, orderId]
      );
    }

    console.log(`✅ Created ${orderCount} orders`);

    // ========================================
    // 5. CONTACTS (30 contatti)
    // ========================================
    console.log('\n📧 Creating contacts...');

    const contactTypes = ['COMPANY', 'SPECIALIST'];
    const contactStatuses = ['new', 'contacted', 'closed'];
    const contactCount = 30;

    for (let i = 0; i < contactCount; i++) {
      const randomUser = usersData[Math.floor(Math.random() * usersData.length)];
      const type = contactTypes[Math.floor(Math.random() * contactTypes.length)];
      const status = contactStatuses[Math.floor(Math.random() * contactStatuses.length)];

      const messages = [
        'Vorrei maggiori informazioni sui corsi disponibili',
        'Sono interessato alla certificazione ISO 27001',
        'Quali sono le date dei prossimi corsi?',
        'Offrite sconti per gruppi aziendali?',
        'Come posso diventare specialista certificato?',
        'Vorrei parlare con un consulente',
        'Quali sono i requisiti per partecipare ai corsi?',
        'Avete corsi online disponibili?',
        'Posso pagare a rate?',
        'Rilasciate attestati riconosciuti?'
      ];

      await client.query(
        `INSERT INTO contacts (name, email, company, user_type, message, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          randomUser.name,
          randomUser.email,
          randomUser.company || null,
          type,
          messages[Math.floor(Math.random() * messages.length)],
          status
        ]
      );
    }

    console.log(`✅ Created ${contactCount} contacts`);

    // ========================================
    // 6. SPECIALIST PROFILES (5 specialisti certificati)
    // ========================================
    console.log('\n👨‍🏫 Creating specialist profiles...');

    const specialists = [
      'specialist1@certicredia.it',
      'specialist2@certicredia.it',
      'specialist3@certicredia.it',
      'specialist4@certicredia.it',
      'specialist5@certicredia.it'
    ];

    for (const specialistEmail of specialists) {
      const userId = userIds[specialistEmail];
      const examScore = 75 + Math.floor(Math.random() * 25); // 75-100

      await client.query(
        `INSERT INTO specialist_profiles (
          user_id, status, exam_score, exam_passed, exam_passed_at, bio
        ) VALUES ($1, 'active', $2, true, NOW() - INTERVAL '6 months', $3)
        ON CONFLICT (user_id) DO UPDATE SET status = 'active', exam_passed = true`,
        [
          userId,
          examScore,
          'Specialista certificato in cybersecurity con oltre 10 anni di esperienza nel settore.'
        ]
      );

      // Aggiungi CPE records (formazione continua)
      for (let i = 0; i < 5; i++) {
        const activities = ['training', 'audit', 'research', 'teaching', 'conference', 'other'];
        const activityType = activities[Math.floor(Math.random() * activities.length)];
        const hours = Math.floor(Math.random() * 20) + 4;

        // Get specialist_profile_id
        const profileResult = await client.query('SELECT id FROM specialist_profiles WHERE user_id = $1', [userId]);
        const specialistProfileId = profileResult.rows[0].id;

        await client.query(
          `INSERT INTO specialist_cpe_records (
            specialist_profile_id, user_id, activity_type, title, activity_date, hours, credits, description, provider, status
          ) VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${Math.floor(Math.random() * 180)} days', $5, $6, $7, $8, $9)`,
          [
            specialistProfileId,
            userId,
            activityType,
            `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} on Cybersecurity`,
            hours,
            hours * 0.5, // credits = hours * 0.5
            `Partecipazione a ${activityType} su tematiche di cybersecurity`,
            'CertiCredia Italia',
            'verified'
          ]
        );
      }
    }

    console.log(`✅ Created ${specialists.length} specialist profiles with CPE records`);

    // ========================================
    // 7. ASSESSMENT TEMPLATES (5 template)
    // ========================================
    console.log('\n📋 Creating assessment templates...');

    const templates = [
      {
        name: 'ISO 27001:2022 Self-Assessment',
        type: 'iso27001',
        description: 'Template per la valutazione ISO 27001:2022',
        templateData: {
          sections: [
            { id: 'context', name: 'Contesto dell\'Organizzazione', questions: 10 },
            { id: 'leadership', name: 'Leadership', questions: 8 },
            { id: 'planning', name: 'Pianificazione', questions: 12 },
            { id: 'support', name: 'Supporto', questions: 15 },
            { id: 'operation', name: 'Attività Operative', questions: 20 },
            { id: 'performance', name: 'Valutazione delle Prestazioni', questions: 10 }
          ]
        }
      },
      {
        name: 'GDPR Compliance Assessment',
        type: 'gdpr',
        description: 'Template per la valutazione GDPR',
        templateData: {
          sections: [
            { id: 'lawfulness', name: 'Liceità del Trattamento', questions: 8 },
            { id: 'data_subjects', name: 'Diritti degli Interessati', questions: 10 },
            { id: 'security', name: 'Sicurezza dei Dati', questions: 12 },
            { id: 'dpo', name: 'DPO e Responsabilità', questions: 6 }
          ]
        }
      },
      {
        name: 'Cybersecurity Maturity Assessment',
        type: 'cybersecurity',
        description: 'Template per la valutazione della maturità cybersecurity',
        templateData: {
          sections: [
            { id: 'identify', name: 'Identify', questions: 10 },
            { id: 'protect', name: 'Protect', questions: 15 },
            { id: 'detect', name: 'Detect', questions: 10 },
            { id: 'respond', name: 'Respond', questions: 8 },
            { id: 'recover', name: 'Recover', questions: 7 }
          ]
        }
      },
      {
        name: 'Cloud Security Assessment',
        type: 'cloud_security',
        description: 'Template per la valutazione della sicurezza cloud',
        templateData: {
          sections: [
            { id: 'governance', name: 'Governance', questions: 8 },
            { id: 'identity', name: 'Identity & Access', questions: 12 },
            { id: 'infrastructure', name: 'Infrastructure Security', questions: 15 },
            { id: 'data', name: 'Data Protection', questions: 10 }
          ]
        }
      },
      {
        name: 'SOC 2 Readiness Assessment',
        type: 'soc2',
        description: 'Template per la valutazione di preparazione SOC 2',
        templateData: {
          sections: [
            { id: 'security', name: 'Security', questions: 20 },
            { id: 'availability', name: 'Availability', questions: 10 },
            { id: 'confidentiality', name: 'Confidentiality', questions: 8 },
            { id: 'privacy', name: 'Privacy', questions: 12 }
          ]
        }
      }
    ];

    const templateIds = [];
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const version = `1.${i}`;
      const result = await client.query(
        `INSERT INTO assessment_templates (
          name, description, structure, version, active, status, created_by
        ) VALUES ($1, $2, $3, $4, true, 'active', $5)
        ON CONFLICT (version) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          structure = EXCLUDED.structure,
          active = EXCLUDED.active,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id`,
        [
          template.name,
          template.description,
          JSON.stringify(template.templateData),
          version,
          userIds['admin@certicredia.it']
        ]
      );
      templateIds.push({ id: result.rows[0].id, type: template.type });
    }

    console.log(`✅ Created ${templates.length} assessment templates`);

    // ========================================
    // 8. ASSESSMENTS (30 assessment instances)
    // ========================================
    console.log('\n📊 Creating assessments...');

    const assessmentStatuses = ['draft', 'submitted', 'under_review', 'approved'];
    const assessmentCount = 30;

    const assessmentIds = [];
    for (let i = 0; i < assessmentCount; i++) {
      const randomOrg = organizationsData[Math.floor(Math.random() * organizationsData.length)];
      const orgId = orgIds[randomOrg.name];
      const template = templateIds[Math.floor(Math.random() * templateIds.length)];
      const status = assessmentStatuses[Math.floor(Math.random() * assessmentStatuses.length)];
      const randomSpecialist = specialists[Math.floor(Math.random() * specialists.length)];

      const result = await client.query(
        `INSERT INTO assessments (
          organization_id, template_id, status, assigned_specialist_id, responses
        ) VALUES ($1, $2, $3, $4, '{}')
        RETURNING id`,
        [
          orgId,
          template.id,
          status,
          status !== 'draft' ? userIds[randomSpecialist] : null
        ]
      );

      assessmentIds.push(result.rows[0].id);

      // Se submitted o approved, aggiungi date
      if (status === 'submitted' || status === 'approved' || status === 'in_review') {
        await client.query(
          `UPDATE assessments SET submitted_at = NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days' WHERE id = $1`,
          [result.rows[0].id]
        );
      }

      if (status === 'approved') {
        await client.query(
          `UPDATE assessments SET approved_at = NOW() - INTERVAL '${Math.floor(Math.random() * 15)} days', approved_by = $1 WHERE id = $2`,
          [userIds['admin@certicredia.it'], result.rows[0].id]
        );
      }
    }

    console.log(`✅ Created ${assessmentCount} assessments`);

    // ========================================
    // 9. SPECIALIST ASSIGNMENTS (20 assegnazioni)
    // ========================================
    console.log('\n🔗 Creating specialist assignments...');

    const assignmentCount = 20;
    for (let i = 0; i < assignmentCount; i++) {
      const randomAssessmentId = assessmentIds[Math.floor(Math.random() * assessmentIds.length)];
      const randomSpecialist = specialists[Math.floor(Math.random() * specialists.length)];
      const statuses = ['pending', 'accepted', 'expired'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      // Get organization_id from the assessment
      const assessmentOrg = await client.query(
        'SELECT organization_id FROM assessments WHERE id = $1',
        [randomAssessmentId]
      );

      const accessToken = `token-${Math.random().toString(36).substring(7)}`;
      const tokenHash = await hash(accessToken, SALT_ROUNDS);

      await client.query(
        `INSERT INTO specialist_assignments (
          assessment_id, organization_id, specialist_id, status, access_token, token_hash, created_by, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '30 days')
        ON CONFLICT DO NOTHING`,
        [
          randomAssessmentId,
          assessmentOrg.rows[0].organization_id,
          userIds[randomSpecialist],
          status,
          accessToken,
          tokenHash,
          userIds['admin@certicredia.it']
        ]
      );
    }

    console.log(`✅ Created specialist assignments`);

    // ========================================
    // 10. REVIEW COMMENTS (40 commenti)
    // ========================================
    console.log('\n💬 Creating review comments...');

    const commentTexts = [
      'Questa sezione richiede maggiori dettagli',
      'La documentazione fornita è incompleta',
      'Necessario aggiungere evidenze documentali',
      'La risposta è corretta ma può essere migliorata',
      'Perfetto, nessun commento',
      'Verificare la conformità con il requisito',
      'Aggiungere riferimenti normativi',
      'La policy allegata non è aggiornata',
      'Ottimo lavoro su questa sezione',
      'Rivedere la valutazione del rischio'
    ];

    const severities = ['info', 'warning', 'critical'];
    const commentStatuses = ['open', 'addressed', 'resolved', 'dismissed'];
    const commentCount = 40;

    for (let i = 0; i < commentCount; i++) {
      const randomAssessmentId = assessmentIds[Math.floor(Math.random() * assessmentIds.length)];
      const randomSpecialist = specialists[Math.floor(Math.random() * specialists.length)];
      const text = commentTexts[Math.floor(Math.random() * commentTexts.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = commentStatuses[Math.floor(Math.random() * commentStatuses.length)];

      await client.query(
        `INSERT INTO review_comments (
          assessment_id, specialist_id, question_id, comment, severity, status
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          randomAssessmentId,
          userIds[randomSpecialist],
          `question-${Math.floor(Math.random() * 20)}`,
          text,
          severity,
          status
        ]
      );
    }

    console.log(`✅ Created ${commentCount} review comments`);

    // ========================================
    // COMMIT
    // ========================================
    await client.query('COMMIT');

    console.log('\n✅ Enhanced demo data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${usersData.length} users`);
    console.log(`   - ${organizationsData.length} organizations`);
    console.log(`   - ${productsData.length} products`);
    console.log(`   - ${orderCount} orders`);
    console.log(`   - ${contactCount} contacts`);
    console.log(`   - ${specialists.length} specialists with CPE records`);
    console.log(`   - ${templates.length} assessment templates`);
    console.log(`   - ${assessmentCount} assessments`);
    console.log(`   - ${assignmentCount} specialist assignments`);
    console.log(`   - ${commentCount} review comments\n`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding enhanced demo data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding
seedEnhancedDemoData()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
