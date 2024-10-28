const puppeteer = require("puppeteer");
require("dotenv").config();

const proxyUsername = 'msnmmayl';
const proxyPassword = '626he4yucyln';

let browser;

const initializeBrowser = async (proxyUrl) => {
  try {
    if (!browser) {
      // Parse proxy URL
      const proxyUrlObj = new URL(proxyUrl);
      const formattedProxy = `${proxyUrlObj.protocol}//${proxyUrlObj.host}`;

      browser = await puppeteer.launch({
        headless: true,
        args: [
          `--proxy-server=${formattedProxy}`,
          '--disable-images',
          '--disable-media',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ],
        executablePath: process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
      });
      console.log('Browser initialized with proxy:', formattedProxy);
    }
    return browser;
  } catch (error) {
    console.error('Browser initialization failed:', error);
    throw error;
  }
};

const testProxyConnection = async (page) => {
  try {
    // Test connection by accessing a reliable website
    await page.goto('http://httpbin.org/ip', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    const content = await page.content();
    console.log('Proxy connection test result:', content);
    return true;
  } catch (error) {
    console.error('Proxy connection test failed:', error);
    return false;
  }
};

const scrapeLogic = async (res, url, cookieValue, proxyUrl) => {
  let page = null;
  
  try {
    browser = await initializeBrowser(proxyUrl);
    page = await browser.newPage();
    
    // Set default timeout
    page.setDefaultTimeout(30000);
    
    // Configure viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Authenticate proxy
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword,
    });

    // Test proxy connection
    const proxyWorking = await testProxyConnection(page);
    if (!proxyWorking) {
      throw new Error('Proxy connection failed verification test');
    }

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
        request.continue();
      }
    });

    // Set cookies
    await page.setCookie({
      name: '_elements_session_4',
      value: cookieValue,
      domain: '.elements.envato.com',
    });

    // Navigate to target URL with error handling
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });

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
    console.error('Scraping failed:', error);
    res.status(500).send(`Scraping failed: ${error.message}`);
  } finally {
    if (page) {
      await page.close();
    }
  }
};

module.exports = { scrapeLogic };
