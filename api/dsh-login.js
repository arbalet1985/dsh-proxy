export default async function handler(req, res) {
  console.log('🔍 RAW req.body:', req.body);
  
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
  
  // ✅ VERCEL 2025: req.body = Buffer
  let parsedBody = {};
  
  try {
    if (req.body) {
      const bodyString = Buffer.isBuffer(req.body) 
        ? req.body.toString('utf8') 
        : String(req.body);
      
      console.log('🔍 Body string:', bodyString.substring(0, 100));
      parsedBody = JSON.parse(bodyString);
      console.log('✅ PARSED:', parsedBody);
    }
  } catch (e) {
    console.error('❌ PARSE ERROR:', e.message);
    res.status(400).json({ error: 'Parse error', raw: String(req.body) });
    return;
  }
  
  // ✅ ТЕПЕРЬ username/image_id точно есть
  const username = parsedBody.username || '';
  const image_id = parsedBody.image_id || '';
  const password = parsedBody.password || '';
  
  console.log('📊 EXTRACTED:', { username: !!username, image_id, hasPass: !!password });
  
  res.json({
    success: true,
    message: 'API РАБОТАЕТ!',
    received: {
      username: username || 'не указано',
      image_id: image_id || 'не указано',
      has_password: !!password,
      raw_length: req.body?.length || 0
    }
  });
}
