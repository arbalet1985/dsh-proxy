export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }
  
  // ✅ VERCEL FIX: правильный парсинг body
  const body = req.body ? Buffer.from(req.body).toString() : '{}';
  let data;
  
  try {
    data = JSON.parse(body);
  } catch {
    res.status(400).json({ error: 'Bad JSON' });
    return;
  }
  
  const { username, password, image_id } = data;
  
  res.json({
    success: true,
    message: '✅ API РАБОТАЕТ!',
    received: {
      username: username || 'не указано',
      image_id: image_id || 'не указано',
      has_password: !!password
    }
  });
}
