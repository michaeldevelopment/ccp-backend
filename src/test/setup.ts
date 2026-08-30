process.env['JWT_SECRET'] = 'test-jwt-secret-at-least-32-characters-long';
process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret-at-least-32-characters';
process.env['SENDGRID_API_KEY'] = 'SG.test-api-key';
process.env['SENDGRID_FROM_EMAIL'] = 'test@example.com';
process.env['VIMEO_ACCESS_TOKEN'] = 'test-vimeo-token';
process.env['DATABASE_URL'] ??= 'postgresql://test:test@localhost:5432/test';
process.env['FRONTEND_URL'] ??= 'http://localhost:3001';
