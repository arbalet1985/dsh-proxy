const puppeteer = require('puppeteer-core');
const chrome = require('chrome-aws-lambda');

module.exports = async (req, res) => {
  // CORS для Telegram Web App и тестов
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
    res.status(400).json({ success: false, error: 'Missing username, password or image_id' });
    return;
  }

  let browser;
  try {
    // Запуск браузера (Vercel serverless)
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: await chrome.executablePath,
      args: chrome.args.concat('--no-sandbox', '--disable-setuid-sandbox'),
      defaultViewport: chrome.defaultViewport
    });

    const page = await browser.newPage();
    
    // Переходим на логин
    console.log('Переход на страницу логина...');
    await page.goto('https://deepskyhosting.com/index.php?do=login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Ждём поля ввода (селекторы из исходного кода)
    await page.waitForSelector('input[name="username"], input[name="login"], input[type="text"]', { timeout: 10000 });
    await page.waitForSelector('input[name="userpass"], input[type="password"]', { timeout: 10000 });
    
    // Вводим данные
    await page.type('input[name="username"], input[name="login"], input[type="text"]', username, { delay: 50 });
    await page.type('input[name="userpass"], input[type="password"]', password, { delay: 50 });
    
    // Отправляем форму
    console.log('Отправка формы логина...');
    const submitSelector = 'input[type="submit"], button[type="submit"], input[type="button"]';
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
      page.click(submitSelector)
    ]);
    
    // Проверяем успешный логин (не находимся на странице логина)
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('do=login')) {
      await browser.close();
      res.json({ success: false, error: 'Неверный логин или пароль' });
      return;
    }
    
    console.log('Логин успешен, ставим лайк...');
    
    // Ставим лайк
    const likeUrl = `https://deepskyhosting.com/phpajax.php?like=1&id=${image_id}`;
    const response = await page.goto(likeUrl, { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    const likeResult = await response.text();
    const result = likeResult.trim();
    
    console.log(`Результат лайка: ${result}`);
    
    await browser.close();
    
    res.json({ 
      success: result === 'OK',
      result: result,
      image_id: image_id
    });
    
  } catch (error) {
    console.error('Ошибка:', error.message);
    if (browser) await browser.close();
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
