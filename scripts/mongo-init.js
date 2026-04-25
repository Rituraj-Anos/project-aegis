db = db.getSiblingDB('aegis');

db.createUser({
  user: 'aegis_app',
  pwd: 'AegisAppPass2024',
  roles: [{ role: 'readWrite', db: 'aegis' }]
});
