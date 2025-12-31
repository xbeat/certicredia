#!/usr/bin/env node

import { pool } from '../server/config/database.js';
import bcrypt from 'bcrypt';
import logger from '../server/utils/logger.js';

const SALT_ROUNDS = 12;

/**
 * SETUP COMPLETO DATABASE
 * Droppa tutto, crea tabelle, inserisce dati di test
 */

async function setupDatabase() {
  const client = await pool.connect();

  try {
    console.log('\n🔥 RESET COMPLETO DATABASE...\n');

    // =============================================
    // 1. DROP TUTTO
    // =============================================
    console.log('1️⃣  Dropping tutte le tabelle...');
    await client.query(`
      DROP TABLE IF EXISTS contacts CASCADE;
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    `);
    console.log('   ✅ Tabelle eliminate\n');

    // =============================================
    // 2. CREA TABELLE
    // =============================================
    console.log('2️⃣  Creando tabelle...');

    // Users
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        vat_number VARCHAR(50),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'Italia',
        role VARCHAR(50) DEFAULT 'user',
        active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_role ON users(role);
      CREATE INDEX idx_users_active ON users(active);
    `);
    console.log('   ✅ users');

    // Products
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        short_description TEXT,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        duration_months INTEGER,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );
      CREATE INDEX idx_products_slug ON products(slug);
      CREATE INDEX idx_products_active ON products(active);
    `);
    console.log('   ✅ products');

    // Orders
    await client.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        order_number VARCHAR(50) NOT NULL UNIQUE,
        billing_name VARCHAR(255) NOT NULL,
        billing_email VARCHAR(255) NOT NULL,
        billing_phone VARCHAR(50),
        billing_address TEXT NOT NULL,
        billing_city VARCHAR(100) NOT NULL,
        billing_postal_code VARCHAR(20) NOT NULL,
        billing_country VARCHAR(100) DEFAULT 'Italia',
        billing_vat VARCHAR(50),
        subtotal_amount DECIMAL(10, 2) NOT NULL,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );
      CREATE INDEX idx_orders_user_id ON orders(user_id);
      CREATE INDEX idx_orders_status ON orders(status);
    `);
    console.log('   ✅ orders');

    // Order Items
    await client.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        product_slug VARCHAR(255),
        unit_price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_order_items_order_id ON order_items(order_id);
    `);
    console.log('   ✅ order_items');

    // Cart Items
    await client.query(`
      CREATE TABLE cart_items (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_cart_items_session_id ON cart_items(session_id);
      CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
    `);
    console.log('   ✅ cart_items');

    // Contacts
    await client.query(`
      CREATE TABLE contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        linkedin VARCHAR(500),
        user_type VARCHAR(50) NOT NULL,
        message TEXT,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_contacts_email ON contacts(email);
      CREATE INDEX idx_contacts_status ON contacts(status);
    `);
    console.log('   ✅ contacts\n');

    // =============================================
    // 3. TRIGGERS
    // =============================================
    console.log('3️⃣  Creando triggers...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('   ✅ Triggers creati\n');

    // =============================================
    // 4. DATI DI TEST
    // =============================================
    console.log('4️⃣  Inserendo dati di test...');

    // Utenti di test
    const testUsers = [
      { email: 'admin@certicredia.test', password: 'Admin123!@#', name: 'Admin System', role: 'admin', company: 'CertiCredia' },
      { email: 'user@certicredia.test', password: 'User123!@#', name: 'Mario Rossi', role: 'user', company: 'Acme Corp' },
      { email: 'specialist@certicredia.test', password: 'Specialist123!@#', name: 'Giulia Verdi', role: 'specialist', company: null },
      { email: 'organization@certicredia.test', password: 'Org123!@#', name: 'Paolo Bianchi', role: 'organization_admin', company: 'Enterprise SRL' }
    ];

    for (const user of testUsers) {
      const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
      await client.query(`
        INSERT INTO users (email, password_hash, name, role, company, active, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [user.email, passwordHash, user.name, user.role, user.company, true, true]);
      console.log(`   ✅ ${user.role}: ${user.email}`);
    }

    // Prodotti
    await client.query(`
      INSERT INTO products (name, slug, short_description, description, price, category, duration_months, active) VALUES
      ('Certificazione ISO 27001', 'iso-27001', 'Sistema di Gestione della Sicurezza delle Informazioni', 'Certificazione completa ISO/IEC 27001 con supporto specialistico dedicato', 2500.00, 'ISO', 12, true),
      ('Certificazione NIS2', 'nis2', 'Conformità Direttiva NIS2 europea', 'Valutazione e certificazione conformità alla Direttiva NIS2 per infrastrutture critiche', 3500.00, 'EU', 12, true),
      ('GDPR Compliance', 'gdpr-compliance', 'Certificazione GDPR completa', 'Valutazione e certificazione conformità GDPR con DPO dedicato', 1800.00, 'Privacy', 12, true),
      ('Penetration Test', 'pentest', 'Test di penetrazione professionale', 'Penetration test completo con report dettagliato e remediation plan', 4500.00, 'Security', 6, true),
      ('ISO 9001', 'iso-9001', 'Certificazione Qualità', 'Sistema di gestione per la qualità secondo ISO 9001:2015', 1500.00, 'ISO', 12, true)
    `);
    console.log('   ✅ 5 prodotti inseriti\n');

    // =============================================
    // 5. RIEPILOGO
    // =============================================
    console.log('\n✅ ================================');
    console.log('✅ DATABASE PRONTO!');
    console.log('✅ ================================\n');
    console.log('📋 CREDENZIALI TEST:\n');
    console.log('🔑 ADMIN:');
    console.log('   Email: admin@certicredia.test');
    console.log('   Password: Admin123!@#\n');
    console.log('👤 USER:');
    console.log('   Email: user@certicredia.test');
    console.log('   Password: User123!@#\n');
    console.log('🎓 SPECIALIST:');
    console.log('   Email: specialist@certicredia.test');
    console.log('   Password: Specialist123!@#\n');
    console.log('🏢 ORGANIZATION ADMIN:');
    console.log('   Email: organization@certicredia.test');
    console.log('   Password: Org123!@#\n');
    console.log('🚀 Avvia il server: npm run dev');
    console.log('🌐 Admin panel: http://localhost:3000/admin.html\n');

  } catch (error) {
    console.error('❌ ERRORE:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Esegui setup
setupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Setup fallito:', error);
    process.exit(1);
  });
