import axios from 'axios';

export default async function handler(req, res) {
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

  const { username, password, image_id } = req.body;
  
  if (!username || !password || !image_id) {
    res.status(400).json({ success: false, error: 'Missing credentials' });
    return;
  }

  const cookies = []; // Массив для cookies
  
  try {
    console.log('🌐 Загружаем логин...');
    
    // 1. GET логин страницы (получаем cookies)
    const loginPage = await axios.get('https://deepskyhosting.com/index.php?do=login', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      maxRedirects: 5
    });
    
    // Извлекаем cookies из ответа
    loginPage.headers['set-cookie']?.forEach(cookie => {
      cookies.push(cookie.split(';')[0]);
    });
    
    // 2. POST логин
    console.log('🔐 Логин...');
    const loginData = new URLSearchParams();
    loginData.append('username', username);
    loginData.append('userpass', password);
    loginData.append('user_remember', '1');
    
    const loginResponse = await axios.post('https://deepskyhosting.com/index.php?do=login', 
      loginData, 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 5
      }
    );
    
    // Обновляем cookies из ответа логина
    loginResponse.headers['set-cookie']?.forEach(cookie => {
      cookies.push(cookie.split(';')[0]);
    });
    
    // 3. Проверяем логин (редирект не на login)
    const finalUrl = loginResponse.request.res.responseUrl || loginResponse.config.url;
    if (finalUrl.includes('login') || finalUrl.includes('do=login')) {
      return res.json({ success: false, error: 'Неверный логин/пароль' });
    }
    
    console.log('👍 Логин OK, лайк...');
    
    // 4. Ставим лайк
    const likeResponse = await axios.get(
      `https://deepskyhosting.com/phpajax.php?like=1&id=${image_id}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': cookies.join('; ')
        }
      }
    );
    
    const likeResult = likeResponse.data.trim();
    
    console.log(`📊 Лайк: "${likeResult}"`);
    
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
