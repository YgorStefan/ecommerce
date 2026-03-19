INSERT INTO "users" (name, email, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'Administrador',
  'admin@ecommerce.com',
  '$2a$10$LXH8J4FkSB9OS9jiG72kPu4riIZgtoPiKnMhT/mzKg6Ogv.ETdVdG',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET role = 'admin', password = '$2a$10$LXH8J4FkSB9OS9jiG72kPu4riIZgtoPiKnMhT/mzKg6Ogv.ETdVdG';
