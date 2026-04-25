import compressionPkg from 'compression';

export const compressionMiddleware = compressionPkg({
  filter: (req, res) => {
    if (req.path.startsWith('/api/v1/reports')) return false;
    return compressionPkg.filter(req, res);
  },
  level: 6,
  threshold: 1024,
});
