db = db.getSiblingDB('aegis');

db.createUser({
  user: 'aegis_app',
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [{ role: 'readWrite', db: 'aegis' }]
});
