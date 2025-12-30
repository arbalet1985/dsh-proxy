export default function handler(req, res) {
  console.log('🔍 [DEBUG] Запрос получен:', {
    method: req.method,
    headers: req.headers,
    body_type: typeof req.body,
    body_raw: req.body
  });

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ [DEBUG] OPTIONS - OK');
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    console.log('❌ [DEBUG] Неверный метод:', req.method);
    res.status(405).json({ error: 'Use POST' });
    return;
  }

  // 🔍 ОТЛАДКА: полная информация о req.body
  console.log('🔍 [DEBUG] req.body детально:', {
    is_buffer: Buffer.isBuffer(req.body),
    body_length: req.body?.length,
    body_string: req.body ? req.body.toString() : 'undefined',
    body_type: typeof req.body
  });

  // ✅ БЕЗОПАСНЫЙ парсинг
  let data = {};
  try {
    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
      const bodyStr = req.body.toString('utf8');
      console.log('🔍 [DEBUG] Парсим JSON:', bodyStr);
      data = JSON.parse(bodyStr);
    } else if (typeof req.body === 'object') {
      data = req.body;
    }
    console.log('✅ [DEBUG] Парсинг успешен:', data);
  } catch (parseError) {
    console.error('❌ [DEBUG] Ошибка парсинга JSON:', parseError.message);
    res.status(400).json({ 
      error: 'JSON parse error', 
      debug: { raw_body: req.body?.toString() }
    });
    return;
  }
  
  const { username, password, image_id } = data;
  
  console.log('📊 [DEBUG] Извлечённые данные:', {
    username: username ? 'OK' : 'MISSING',
    has_password: !!password,
    image_id: image_id || 'MISSING'
  });

  // ✅ ТЕСТОВЫЙ ОТВЕТ
  res.json({
    success: true,
    message: 'API РАБОТАЕТ!',
    debug: {
      method: req.method,
      body_parsed: data,
      username: username || 'не указано',
      image_id: image_id || 'не указано',
      has_password: !!password,
      timestamp: new Date().toISOString()
    }
  });
  
  console.log('✅ [DEBUG] Ответ отправлен');
}
