import { Client } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `CC-${timestamp}-${random}`;
};

async function seedOrders() {
  const client = new Client(
    process.env.DATABASE_URL || {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'certicredia',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432')
    }
  );

  try {
    await client.connect();
    console.log('✅ Connesso al database');

    // Get regular users (non-admin, non-specialist)
    const usersResult = await client.query(
      `SELECT id, email, name FROM users
       WHERE role = 'user'
       LIMIT 5`
    );

    if (usersResult.rows.length === 0) {
      console.log('⚠️  Nessun utente trovato. Crea prima degli utenti.');
      return;
    }

    console.log(`📦 Trovati ${usersResult.rows.length} utenti`);

    // Get active products
    const productsResult = await client.query(
      `SELECT id, name, price FROM products
       WHERE active = true
       LIMIT 10`
    );

    if (productsResult.rows.length === 0) {
      console.log('⚠️  Nessun prodotto trovato. Crea prima dei prodotti.');
      return;
    }

    console.log(`📦 Trovati ${productsResult.rows.length} prodotti`);

    const users = usersResult.rows;
    const products = productsResult.rows;

    const orderStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
    const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    const paymentMethods = ['bank_transfer', 'credit_card', 'paypal'];

    let totalOrders = 0;

    // Create 2-3 orders per user
    for (const user of users) {
      const numOrders = Math.floor(Math.random() * 2) + 2; // 2-3 orders

      for (let i = 0; i < numOrders; i++) {
        await client.query('BEGIN');

        try {
          // Random number of products per order (1-4)
          const numProducts = Math.floor(Math.random() * 4) + 1;
          const orderProducts = [];

          // Select random products
          for (let j = 0; j < numProducts; j++) {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity

            // Avoid duplicates in same order
            if (!orderProducts.find(p => p.id === randomProduct.id)) {
              orderProducts.push({
                ...randomProduct,
                quantity
              });
            }
          }

          // Calculate totals
          const subtotalAmount = orderProducts.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * item.quantity);
          }, 0);

          const taxAmount = subtotalAmount * 0.22; // IVA 22%
          const totalAmount = subtotalAmount + taxAmount;

          // Random status and payment info
          const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
          const paymentStatus = status === 'completed'
            ? 'paid'
            : paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
          const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

          // Create order
          const orderNumber = generateOrderNumber();

          const orderResult = await client.query(
            `INSERT INTO orders (
              user_id, order_number, status, subtotal_amount, tax_amount, total_amount,
              payment_method, payment_status,
              billing_name, billing_email, billing_phone,
              billing_address, billing_city, billing_postal_code, billing_country,
              created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW() - INTERVAL '${Math.floor(Math.random() * 90)} days')
            RETURNING *`,
            [
              user.id,
              orderNumber,
              status,
              subtotalAmount,
              taxAmount,
              totalAmount,
              paymentMethod,
              paymentStatus,
              user.name || 'Cliente Test',
              user.email,
              '+39 333 1234567',
              'Via Roma 123',
              'Milano',
              '20100',
              'Italia'
            ]
          );

          const order = orderResult.rows[0];

          // Create order items
          for (const product of orderProducts) {
            await client.query(
              `INSERT INTO order_items (
                order_id, product_id, product_name, product_slug,
                quantity, unit_price, total_price
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                order.id,
                product.id,
                product.name,
                product.name.toLowerCase().replace(/\s+/g, '-'),
                product.quantity,
                product.price,
                parseFloat(product.price) * product.quantity
              ]
            );
          }

          await client.query('COMMIT');
          totalOrders++;

          console.log(`✅ Ordine creato: ${orderNumber} per ${user.email} (${orderProducts.length} prodotti, €${totalAmount.toFixed(2)})`);

        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`❌ Errore creazione ordine per ${user.email}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Seed completato! ${totalOrders} ordini creati.`);

  } catch (error) {
    console.error('❌ Errore durante il seed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedOrders();
