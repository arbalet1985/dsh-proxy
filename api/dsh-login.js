import axios from 'axios';

let savedCookies = []; // 🎯 ГЛОБАЛЬНАЯ сессия

export default async function handler(req, res) {
  // ... CORS код тот же ...

  const { username, password, image_id, use_saved_session = true } = req.body;
  
  const cookies = savedCookies.length > 0 ? [...savedCookies] : [];

  try {
    // Если нет сессии ИЛИ use_saved_session=false → логин
    if (cookies.length === 0 || !use_saved_session) {
      console.log('🔐 Логин...');
      const loginData = new URLSearchParams();
      loginData.append('username', username);
      loginData.append('userpass', password);
      
      const loginRes = await axios.post('https://deepskyhosting.com/index.php?do=login', loginData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0...' },
        maxRedirects: 5
      });
      
      // Сохраняем cookies сессии
      loginRes.headers['set-cookie']?.forEach(c => savedCookies.push(c.split(';')[0]));
      cookies.push(...savedCookies);
    }
    
    // Лайк с сессией
    const likeRes = await axios.get(`https://deepskyhosting.com/phpajax.php?like=1&id=${image_id}`, {
      headers: { 'Cookie': cookies.join('; '), 'User-Agent': 'Mozilla/5.0...' }
    });
    
    const result = likeRes.data.trim();
    res.json({ success: result === 'OK', result, image_id, session_active: savedCookies.length > 0 });
    
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
}
