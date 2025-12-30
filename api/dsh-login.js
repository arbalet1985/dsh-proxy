export default async function handler(req, res) {
  // ✅ CORS ПЕРВЫМ ДЕЛОМ
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // ✅ OPTIONS ПЕРВЫМ ДЕЛОМ
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS OK');
    res.status(200).end();
    return;
  }
  
  // ✅ НЕ-ПОСТ ПЕРВЫМ ДЕЛОМ
  if (req.method !== 'POST') {
    console.log('❌ Method:', req.method);
    res.status(405).json({ error: 'Use POST' });
    return;
  }
  
  // ✅ БЕЗОПАСНЫЙ PARSE ПЕРЕД ЛЮБЫМИ { username }
  console.log('🔍 req.body:', req.body);
  
  let bodyData = {};
  try {
    if (req.body) {
      const bodyString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
      bodyData = JSON.parse(bodyString || '{}');
    }
  } catch(e) {
    console.error('❌ Parse error:', e.message);
  }
  
  // ✅ ТЕПЕРЬ безопасно деструктуризуем
  const { username = '', password = '', image_id = '' } = bodyData;
  
  console.log('✅ Parsed:', { username: !!username, image_id });
  
  res.json({
    success: true,
    message: 'API РАБОТАЕТ!',
    received: { username: username || 'не указано', image_id: image_id || 'не указано' }
  });
}
