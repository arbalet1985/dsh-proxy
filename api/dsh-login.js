export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'GET') {
    res.status(405).json({ error: 'Use POST method' });
    return;
  }
  
  // ✅ ВЕРСИЯ ВЕРЦЕЛ: req.body = Buffer
  let body;
  try {
    body = JSON.parse(req.body.toString());
  } catch(e) {
    body = {};
  }
  
  const { username = '', password = '', image_id = '' } = body;
  
  res.json({ 
    success: true,
    message: 'API РАБОТАЕТ!',
    data: {
      username: username || '[не указано]',
      password: password ? '[защищено]' : '[не указано]',
      image_id: image_id || '[не указано]'
    }
  });
}
