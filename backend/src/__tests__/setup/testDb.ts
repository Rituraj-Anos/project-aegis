import mongoose from 'mongoose';

export async function connectTestDb(): Promise<void> {
  await mongoose.connect(process.env['MONGODB_URI']!);
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
}

export async function clearCollections(): Promise<void> {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((c) => c.deleteMany({})),
  );
}

export async function dropTestDb(): Promise<void> {
  await mongoose.connection.dropDatabase();
}
