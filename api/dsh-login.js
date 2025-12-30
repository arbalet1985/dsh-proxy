import puppeteer from 'puppeteer-core';
import chrome from 'chrome-aws-lambda';

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

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: await chrome.executablePath,
      args: [
        ...chrome.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('🌐 Переход на логин...');
    await page.goto('https://deepskyhosting.com/index.php?do=login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Универсальные селекторы
    const usernameSelector = 'input[name="username"], input[name="login"], input[type="text"]:not([type="hidden"])';
    const passwordSelector = 'input[name="userpass"], input[name="password"], input[type="password"]';
    const submitSelector = 'input[type="submit"], button[type="submit"], .btn, input[value*="Войти"]';
    
    await page.waitForSelector(usernameSelector, { timeout: 10000 });
    await page.waitForSelector(passwordSelector, { timeout: 10000 });
    
    await page.type(usernameSelector, username, { delay: 100 });
    await page.type(passwordSelector, password, { delay: 100 });
    
    console.log('🔐 Отправка формы...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
      page.click(submitSelector)
    ]);
    
    // Проверка логина
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('do=login')) {
      await browser.close();
      return res.json({ success: false, error: 'Неверный логин/пароль' });
    }
    
    console.log('👍 Логин OK, ставим лайк...');
    
    // Лайк
    const likeUrl = `https://deepskyhosting.com/phpajax.php?like=1&id=${image_id}`;
    const response = await page.goto(likeUrl, { waitUntil: 'networkidle0' });
    const likeResult = (await response.text()).trim();
    
    await browser.close();
    
    console.log(`📊 Лайк результат: ${likeResult}`);
    
    res.json({ 
      success: likeResult === 'OK',
      result: likeResult,
      image_id: parseInt(image_id)
    });
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (browser) await browser.close();
    res.status(500).json({ success: false, error: error.message });
  }
}
