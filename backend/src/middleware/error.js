import multer from 'multer';

export function notFound(req, res) {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be under 5 MB' : err.message });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'A record with the same unique value already exists' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ message: 'This record is in use and cannot be deleted' });
  }
  const status = err.status || err.statusCode || 500;
  if (status >= 500 && !err.expose) console.error(err);
  // Razorpay SDK errors carry { error: { description } }
  const message = err.expose || status < 500 ? err.message || err.error?.description : 'Something went wrong. Please try again.';
  res.status(status).json({ message, details: err.details });
}
