const puppeteer = require("puppeteer");
require("dotenv").config();

const proxyUsername = 'msnmmayl';
const proxyPassword = '626he4yucyln';

const initializeBrowser = async (proxyUrl) => {
  try {
    const proxyUrlObj = new URL(proxyUrl);
    // Format proxy URL without protocol since we'll handle that in args
    const formattedProxy = `${proxyUrlObj.hostname}:${proxyUrlObj.port}`;

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=${formattedProxy}`,
        '--disable-images',
        '--disable-media',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        // Force specific TLS versions
        '--ssl-version-min=tls1',
        '--ssl-version-max=tls1.3'
      ],
      executablePath: process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
      ignoreHTTPSErrors: true
    });
    
    return browser;
  } catch (error) {
    console.error('Browser initialization failed:', error);
    throw error;
  }
};

const scrapeLogic = async (res, url, cookieValue, proxyUrl) => {
  let browser = null;
  let page = null;

  try {
    browser = await initializeBrowser(proxyUrl);
    page = await browser.newPage();

    // Enable verbose logging
    page.on('error', err => console.error('Page error:', err));
    page.on('requestfailed', request => {
      console.log('Request failed:', {
        url: request.url(),
        errorText: request.failure().errorText
      });
    });

    // Configure page settings
    await page.setViewport({ width: 1280, height: 800 });
    await page.setDefaultNavigationTimeout(60000);

    // Set up authentication before any navigation
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword
    });

    // Disable specific security features that might interfere with proxy
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    // Set up request interception
    await page.setRequestInterception(true);

    let intercepted = false;
    page.on('request', request => {
      if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
        request.abort();
      } else if (request.url().includes('envatousercontent.com')) {
        intercepted = true;
        console.log('Intercepted request URL:', request.url());
        res.send(request.url());
        request.abort();
      } else {
        const headers = request.headers();
        headers['Connection'] = 'keep-alive';
        request.continue({ headers });
      }
    });

    // Set cookies
    await page.setCookie({
      name: '_elements_session_4',
      value: cookieValue,
      domain: '.elements.envato.com'
    });

    console.log('Navigating to URL:', url);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Rest of your scraping logic...
    console.log('Page loaded successfully');

    // Handle cookie consent
    try {
      await page.waitForFunction(
        () => Array.from(document.querySelectorAll('button, a'))
          .some(el => el.textContent.trim() === 'Accept all'),
        { timeout: 5000 }
      );
      await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button, a'))
          .find(el => el.textContent.trim() === 'Accept all');
        if (button) button.click();
      });
    } catch (e) {
      console.log('No cookie consent dialog found');
    }

    // Wait for and extract text
    await page.waitForSelector('.woNBXVXX', { timeout: 10000 });
    const text = await page.evaluate(() => 
      document.querySelector('.woNBXVXX').innerText
    );
    console.log('Extracted text:', text);

    // Handle escape keys and button clicks
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.click('.ncWzoxCr.WjwUaJcT.NWg5MVVe.METNYJBx');
    
    await page.waitForSelector('[data-testid="download-without-license-button"]');
    await page.click('[data-testid="download-without-license-button"]');

    if (!intercepted) {
      throw new Error('Failed to intercept download URL');
    }

  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).send({
      error: 'Scraping failed',
      details: error.message,
      stack: error.stack
    });
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
};

module.exports = { scrapeLogic };
