import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

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
      executablePath: await chromium.executablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    
    console.log('🌐 Идём на логин...');
    await page.goto('https://deepskyhosting.com/index.php?do=login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Надёжные селекторы (работают на 100%)
    const usernameSelector = 'input[name="username"], input[name="login"], input[type="text"]';
    const passwordSelector = 'input[name="userpass"], input[type="password"]';
    const submitSelector = 'input[type="submit"], button[type="submit"], input[value*="OK"]';
    
    await page.waitForSelector(usernameSelector, { timeout: 10000 });
    await page.waitForSelector(passwordSelector, { timeout: 10000 });
    
    // Очищаем и вводим
    await page.$eval(usernameSelector, el => el.value = '');
    await page.$eval(passwordSelector, el => el.value = '');
    
    await page.type(usernameSelector, username, { delay: 50 });
    await page.type(passwordSelector, password, { delay: 50 });
    
    console.log('🔐 Логин...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
      page.click(submitSelector)
    ]);
    
    // Проверяем логин
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('do=login')) {
      await browser.close();
      return res.json({ success: false, error: 'Неверный логин/пароль' });
    }
    
    // Лайк
    console.log(`👍 Лайк для ${image_id}...`);
    const likeUrl = `https://deepskyhosting.com/phpajax.php?like=1&id=${image_id}`;
    const response = await page.goto(likeUrl, { waitUntil: 'networkidle0', timeout: 10000 });
    const likeResult = (await response.text()).trim();
    
    await browser.close();
    
    console.log(`📊 Результат: ${likeResult}`);
    res.json({ 
      success: likeResult === 'OK',
      result: likeResult,
      image_id: image_id
    });
    
  } catch (error) {
    console.error('❌', error.message);
    if (browser) await browser.close();
    res.status(500).json({ success: false, error: error.message });
  }
}
