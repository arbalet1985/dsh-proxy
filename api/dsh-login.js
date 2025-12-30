export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  // Безопасный парсинг body
  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch(e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  
  const { username, password, image_id } = body;
  
  // ТЕСТОВЫЙ ОТВЕТ - БЕЗ АКСИОС
  res.json({ 
    success: true,
    message: 'API РАБОТАЕТ!',
    received: { username, password: password ? '***' : '', image_id },
    timestamp: new Date().toISOString()
  });
}
