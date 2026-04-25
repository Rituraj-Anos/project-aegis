import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const MONGO_URI_FILE = join(tmpdir(), '__aegis_test_mongo_uri__');

// Read URI written by globalSetup (cross-process safe)
const mongoUri = existsSync(MONGO_URI_FILE)
  ? readFileSync(MONGO_URI_FILE, 'utf8').trim()
  : 'mongodb://127.0.0.1:27017/aegis_test';

process.env['NODE_ENV']              = 'test';
process.env['MONGODB_URI']          = mongoUri;
process.env['JWT_ACCESS_SECRET']    = 'test-jwt-access-secret-min-32-chars-long!!';
process.env['JWT_REFRESH_SECRET']   = 'test-jwt-refresh-secret-min-32-chars!!';
process.env['JWT_ACCESS_EXPIRES_IN']  = '15m';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
process.env['ENCRYPTION_KEY']       = 'a'.repeat(64);
process.env['GROQ_API_KEY']       = 'test-key';
process.env['GROQ_BASE_URL']      = 'https://api.groq.com/openai';
process.env['GROQ_MODEL']         = 'llama-3.3-70b-versatile';
process.env['REDIS_URL']            = 'redis://localhost:6379';
process.env['STORAGE_PROVIDER']     = 'local';
process.env['LOCAL_UPLOAD_DIR']     = './test-uploads';
process.env['LOCAL_UPLOAD_URL']     = 'http://localhost:5000/uploads';
process.env['SMTP_HOST']            = 'localhost';
process.env['SMTP_PORT']            = '465';
process.env['SMTP_USER']            = 'test';
process.env['SMTP_PASS']            = 'test';
process.env['EMAIL_FROM']           = 'test@test.com';
process.env['CLIENT_URL']           = 'http://localhost:3000';
process.env['CORS_ORIGINS']         = 'http://localhost:3000';
process.env['ALLOWED_ORIGINS']      = 'http://localhost:3000';
