-- ============================================
-- SEED DATA FOR CERTICREDIA
-- Sample products, users, and initial data
-- ============================================

-- ============================================
-- SAMPLE PRODUCTS
-- ============================================

-- Certification Products
INSERT INTO products (sku, type, name_it, name_en, description_it, description_en, short_description_it, short_description_en, price, stock_quantity, is_digital, is_featured) VALUES
(
    'CERT-CPF-FULL',
    'certification',
    'Certificazione CPF Completa con Assessor',
    'Full CPF Certification with Assessor',
    'Certificazione ufficiale Cybersecurity Psychology Framework con valutazione guidata da un CPF Certified Assessor. Include: analisi completa della matrice 10x10, report dettagliato, piano di remediation e certificato ufficiale valido 2 anni.',
    'Official Cybersecurity Psychology Framework certification with guided assessment by a CPF Certified Assessor. Includes: complete 10x10 matrix analysis, detailed report, remediation plan, and official 2-year certificate.',
    'Certificazione completa con supporto di un Assessor certificato',
    'Complete certification with certified Assessor support',
    4500.00,
    -1,
    TRUE,
    TRUE
),
(
    'CERT-CPF-SELF',
    'certification',
    'Auto-Assessment CPF',
    'CPF Self-Assessment',
    'Inizia il tuo percorso di certificazione con un auto-assessment guidato. Accesso alla piattaforma CPF, questionari strutturati, report preliminare con scoring ternario (Verde/Giallo/Rosso). Ideale per capire il tuo livello di maturità.',
    'Start your certification journey with a guided self-assessment. Access to CPF platform, structured questionnaires, preliminary report with ternary scoring (Green/Yellow/Red). Ideal for understanding your maturity level.',
    'Valutazione autonoma con report preliminare',
    'Autonomous assessment with preliminary report',
    990.00,
    -1,
    TRUE,
    TRUE
);

-- Course Products
INSERT INTO products (sku, type, name_it, name_en, description_it, description_en, short_description_it, short_description_en, price, stock_quantity, is_digital, is_featured) VALUES
(
    'COURSE-ASSESSOR',
    'course',
    'Corso CPF Certified Assessor',
    'CPF Certified Assessor Course',
    'Diventa un valutatore certificato CPF. Corso intensivo di 5 giorni che copre: fondamenti di psicoanalisi (Klein, Bion, Jung), scienze cognitive (Kahneman, Cialdini), integrazione NIST/OWASP, metodologia di scoring, etica professionale. Include esame finale e certificazione.',
    'Become a certified CPF assessor. Intensive 5-day course covering: psychoanalysis fundamentals (Klein, Bion, Jung), cognitive sciences (Kahneman, Cialdini), NIST/OWASP integration, scoring methodology, professional ethics. Includes final exam and certification.',
    'Formazione professionale per diventare Assessor CPF',
    'Professional training to become a CPF Assessor',
    3200.00,
    -1,
    TRUE,
    TRUE
),
(
    'COURSE-CISO-INTRO',
    'course',
    'CPF per CISO: Introduzione',
    'CPF for CISOs: Introduction',
    'Workshop di 1 giorno dedicato ai responsabili della sicurezza. Come integrare il CPF nel tuo programma di security awareness. Casi studio reali, ROI analysis, tecniche di implementazione.',
    '1-day workshop for security leaders. How to integrate CPF into your security awareness program. Real case studies, ROI analysis, implementation techniques.',
    'Workshop di 1 giorno per responsabili della sicurezza',
    '1-day workshop for security leaders',
    850.00,
    -1,
    TRUE,
    FALSE
);

-- Book Products
INSERT INTO products (sku, type, name_it, name_en, description_it, description_en, short_description_it, short_description_en, price, stock_quantity, is_digital) VALUES
(
    'BOOK-CPF-GUIDE',
    'book',
    'Manuale CPF: La Psicologia della Cybersecurity',
    'CPF Manual: The Psychology of Cybersecurity',
    'Il manuale ufficiale del Cybersecurity Psychology Framework. 350 pagine che coprono teoria, pratica e casi studio. Autori: Team di ricerca CPF3.org. Formato digitale PDF.',
    'The official Cybersecurity Psychology Framework manual. 350 pages covering theory, practice, and case studies. Authors: CPF3.org research team. Digital PDF format.',
    'Manuale ufficiale del framework (PDF)',
    'Official framework manual (PDF)',
    45.00,
    -1,
    TRUE
),
(
    'BOOK-CPF-PRINT',
    'book',
    'Manuale CPF: La Psicologia della Cybersecurity (Cartaceo)',
    'CPF Manual: The Psychology of Cybersecurity (Print)',
    'Il manuale ufficiale del Cybersecurity Psychology Framework in versione cartacea. 350 pagine, copertina rigida. Spedizione inclusa in Italia.',
    'The official Cybersecurity Psychology Framework manual in print version. 350 pages, hardcover. Shipping included in Italy.',
    'Manuale ufficiale - versione cartacea',
    'Official manual - print version',
    65.00,
    100,
    FALSE
);

-- Assessment Products (additional options)
INSERT INTO products (sku, type, name_it, name_en, description_it, description_en, short_description_it, short_description_en, price, stock_quantity, is_digital) VALUES
(
    'ASSESS-REFRESH',
    'assessment',
    'Re-Assessment Annuale',
    'Annual Re-Assessment',
    'Mantieni aggiornata la tua certificazione con un re-assessment annuale. Monitoraggio continuo, identificazione di nuove vulnerabilità, aggiornamento del report.',
    'Keep your certification updated with an annual re-assessment. Continuous monitoring, identification of new vulnerabilities, report update.',
    'Rinnovo annuale della valutazione',
    'Annual assessment renewal',
    1200.00,
    -1,
    TRUE
);

-- ============================================
-- SAMPLE ADMIN USER (Password: Admin123! - CHANGE IN PRODUCTION!)
-- ============================================

INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, is_active) VALUES
(
    'admin@certicredia.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYPdx7r6PLe', -- Admin123!
    'Admin',
    'Certicredia',
    'admin',
    TRUE,
    TRUE
);

-- ============================================
-- NOTES
-- ============================================
-- Password hashes are generated with bcrypt, rounds=12
-- Default admin password is: Admin123! - MUST BE CHANGED
-- All prices are in EUR
-- Stock quantity -1 means unlimited (digital products)
