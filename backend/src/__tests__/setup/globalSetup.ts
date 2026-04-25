import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const MONGO_URI_FILE = join(tmpdir(), '__aegis_test_mongo_uri__');

export default async function globalSetup() {
  const mongod = await MongoMemoryReplSet.create({
    replSet: { count: 1, dbName: 'aegis_test' },
  });

  const uri = mongod.getUri();

  // Write URI to temp file so worker processes can read it
  writeFileSync(MONGO_URI_FILE, uri, 'utf8');

  (globalThis as any).__MONGOD__ = mongod;
}
