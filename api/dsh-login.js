import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

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

  const cookieJar = new CookieJar();
  const client = wrapper(axios.create({ jar: cookieJar }));

  try {
    console.log('🌐 Получаем страницу логина...');
    
    // 1. Загружаем страницу логина (получаем CSRF токены)
    const loginPage = await client.get('https://deepskyhosting.com/index.php?do=login');
    
    // 2. Парсим форму (ищем поля)
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('userpass', password);
    formData.append('user_remember', '1'); // Запомнить меня
    formData.append('submit', 'Войти'); // Кнопка
    
    console.log('🔐 Логин...');
    
    // 3. Отправляем логин
    const loginResponse = await client.post(
      'https://deepskyhosting.com/index.php?do=login', 
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        maxRedirects: 5
      }
    );
    
    // 4. Проверяем успешный логин (редирект или статус)
    const currentUrl = loginResponse.request.res.responseUrl || loginResponse.config.url;
    if (currentUrl.includes('login') || currentUrl.includes('do=login')) {
      return res.json({ success: false, error: 'Неверный логин/пароль' });
    }
    
    console.log('👍 Логин успешен! Ставим лайк...');
    
    // 5. Ставим лайк с сессионными куки
    const likeResponse = await client.get(
      `https://deepskyhosting.com/phpajax.php?like=1&id=${image_id}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    const likeResult = likeResponse.data.trim();
    
    console.log(`📊 Результат лайка: "${likeResult}"`);
    
    res.json({ 
      success: likeResult === 'OK',
      result: likeResult,
      image_id: image_id
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data || error.message 
    });
  }
}
