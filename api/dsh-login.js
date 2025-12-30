import axios from 'axios';

export default async function handler(req, res) {
  // CORS для всех запросов
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // ✅ ФИКС: OPTIONS обрабатываем ПЕРВЫМИ
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  // ✅ ФИКС: Проверяем req.body перед деструктуризацией
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch(e) {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }
  
  const { username, password, image_id } = body;
  
  if (!username || !password || !image_id) {
    res.status(400).json({ success: false, error: 'Missing username, password or image_id' });
    return;
  }

  try {
    console.log('🌐 Логин на DeepSkyHosting...');
    
    // 1. POST логин
    const loginData = new URLSearchParams();
    loginData.append('username', username);
    loginData.append('userpass', password);
    loginData.append('user_remember', '1');
    
    const loginResponse = await axios.post(
      'https://deepskyhosting.com/index.php?do=login',
      loginData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        maxRedirects: 5
      }
    );
    
    // 2. Извлекаем cookies
    const cookies = [];
    loginResponse.headers['set-cookie']?.forEach(cookie => {
      cookies.push(cookie.split(';')[0]);
    });
    
    // 3. Ставим лайк
    console.log(`👍 Лайк для ${image_id}...`);
    const likeResponse = await axios.get(
      `https://deepskyhosting.com/phpajax.php?like=1&id=${image_id}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': cookies.join('; ')
        }
      }
    );
    
    const likeResult = likeResponse.data.trim();
    
    res.json({ 
      success: likeResult === 'OK',
      result: likeResult,
      image_id: image_id
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.statusText || error.message 
    });
  }
}
