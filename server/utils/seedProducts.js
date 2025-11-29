import { pool } from '../config/database.js';
import logger from './logger.js';

const products = [
  {
    name: 'Certificazione CPF3 Base',
    slug: 'cpf3-base',
    description: 'Certificazione base CPF3:2025 per aziende fino a 50 dipendenti. Include dashboard compliance, matrice di valutazione e supporto email.',
    short_description: 'Certificazione base per PMI',
    price: 2999.00,
    category: 'Certificazioni',
    image_url: '/assets/products/cpf3-base.jpg',
    features: JSON.stringify([
      'Dashboard Compliance CPF3',
      'Matrice 10x10 indicatori',
      'Report psicologico trimestrale',
      'Supporto email 5/7',
      'Validità 12 mesi'
    ]),
    duration_months: 12,
    certification_type: 'CPF3-BASE'
  },
  {
    name: 'Certificazione CPF3 Professional',
    slug: 'cpf3-professional',
    description: 'Certificazione professionale CPF3:2025 per aziende fino a 250 dipendenti. Include tutto il pacchetto Base più audit on-site e formazione del personale.',
    short_description: 'Soluzione completa per medie imprese',
    price: 7999.00,
    category: 'Certificazioni',
    image_url: '/assets/products/cpf3-pro.jpg',
    features: JSON.stringify([
      'Tutto del pacchetto Base',
      'Audit on-site semestrale',
      'Formazione personale (8h)',
      'Supporto telefonico 7/7',
      'Report mensile personalizzato',
      'Badge digitale blockchain',
      'Validità 12 mesi'
    ]),
    duration_months: 12,
    certification_type: 'CPF3-PRO'
  },
  {
    name: 'Certificazione CPF3 Enterprise',
    slug: 'cpf3-enterprise',
    description: 'Certificazione enterprise CPF3:2025 per grandi aziende oltre 250 dipendenti. Soluzione completa con consulente dedicato e integrazione sistemi.',
    short_description: 'Soluzione enterprise completa',
    price: 19999.00,
    category: 'Certificazioni',
    image_url: '/assets/products/cpf3-enterprise.jpg',
    features: JSON.stringify([
      'Tutto del pacchetto Professional',
      'Consulente dedicato',
      'Audit on-site trimestrale',
      'Formazione avanzata (40h)',
      'Integrazione API sistemi HR',
      'SLA 99.9% uptime',
      'Report settimanale C-level',
      'Validità 12 mesi'
    ]),
    duration_months: 12,
    certification_type: 'CPF3-ENTERPRISE'
  },
  {
    name: 'Corso Auditor SecurCert',
    slug: 'corso-auditor',
    description: 'Corso completo per diventare Auditor certificato SecurCert. Include 40 ore di formazione, materiali didattici e esame finale.',
    short_description: 'Formazione completa auditor',
    price: 1999.00,
    category: 'Formazione',
    image_url: '/assets/products/corso-auditor.jpg',
    features: JSON.stringify([
      '40 ore di formazione online',
      'Materiali didattici completi',
      'Accesso piattaforma 6 mesi',
      'Esame teorico-pratico',
      'Certificato ufficiale',
      'Badge digitale LinkedIn'
    ]),
    duration_months: 6,
    certification_type: 'AUDITOR-COURSE'
  },
  {
    name: 'Audit NIS2 Compliance',
    slug: 'audit-nis2',
    description: 'Verifica completa della conformità alla direttiva NIS2. Report dettagliato con gap analysis e piano di remediation.',
    short_description: 'Audit NIS2 completo',
    price: 4999.00,
    category: 'Audit',
    image_url: '/assets/products/audit-nis2.jpg',
    features: JSON.stringify([
      'Gap analysis NIS2',
      'Report dettagliato conformità',
      'Piano remediation',
      'Intervista stakeholder',
      'Verifica documentale',
      'Presentazione C-level'
    ]),
    duration_months: 3,
    certification_type: 'NIS2-AUDIT'
  },
  {
    name: 'Certificazione ISO 27001',
    slug: 'iso-27001',
    description: 'Percorso completo per ottenere la certificazione ISO 27001. Include consulenza, audit interni e supporto fino all\'ottenimento della certificazione.',
    short_description: 'Certificazione ISO 27001 completa',
    price: 12999.00,
    category: 'Certificazioni',
    image_url: '/assets/products/iso-27001.jpg',
    features: JSON.stringify([
      'Consulenza dedicata',
      'Gap analysis iniziale',
      'Predisposizione documentazione',
      'Audit interni',
      'Supporto audit esterno',
      'Validità 36 mesi'
    ]),
    duration_months: 36,
    certification_type: 'ISO-27001'
  },
  {
    name: 'Penetration Test Base',
    slug: 'pentest-base',
    description: 'Penetration test base per infrastrutture fino a 10 host. Include report dettagliato e remediation plan.',
    short_description: 'Pentest infrastruttura base',
    price: 3499.00,
    category: 'Security Testing',
    image_url: '/assets/products/pentest-base.jpg',
    features: JSON.stringify([
      'Scan fino a 10 host',
      'Test vulnerabilità OWASP Top 10',
      'Report esecutivo + tecnico',
      'Remediation plan',
      'Re-test dopo fix incluso'
    ]),
    duration_months: 1,
    certification_type: 'PENTEST-BASE'
  },
  {
    name: 'Formazione GDPR Aziendale',
    slug: 'formazione-gdpr',
    description: 'Corso di formazione GDPR per tutto il personale aziendale. Sessioni online personalizzate e materiali didattici.',
    short_description: 'Formazione GDPR completa',
    price: 999.00,
    category: 'Formazione',
    image_url: '/assets/products/corso-gdpr.jpg',
    features: JSON.stringify([
      'Sessioni online personalizzate',
      'Materiali didattici inclusi',
      'Test di verifica',
      'Attestato partecipazione',
      'Supporto post-corso 30gg'
    ]),
    duration_months: 1,
    certification_type: 'GDPR-TRAINING'
  }
];

async function seedProducts() {
  const client = await pool.connect();

  try {
    logger.info('🌱 Inizio seed prodotti...');

    await client.query('BEGIN');

    for (const product of products) {
      // Check if product already exists
      const existing = await client.query(
        'SELECT id FROM products WHERE slug = $1',
        [product.slug]
      );

      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO products (
            name, slug, description, short_description, price, category,
            image_url, features, duration_months, certification_type, active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)`,
          [
            product.name,
            product.slug,
            product.description,
            product.short_description,
            product.price,
            product.category,
            product.image_url,
            product.features,
            product.duration_months,
            product.certification_type
          ]
        );
        logger.info(`✅ Prodotto creato: ${product.name}`);
      } else {
        logger.info(`⏭️  Prodotto già esistente: ${product.name}`);
      }
    }

    await client.query('COMMIT');
    logger.info('✅ Seed prodotti completato!');

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Errore seed prodotti:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProducts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedProducts;
