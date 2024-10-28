const puppeteer = require("puppeteer");
require("dotenv").config();
const https = require('https');

const proxyUsername = 'msnmmayl';
const proxyPassword = '626he4yucyln';

// Utility function to test direct proxy connection
const testDirectProxy = (proxyUrl) => {
  return new Promise((resolve, reject) => {
    const proxyUrlObj = new URL(proxyUrl);
    
    const options = {
      host: proxyUrlObj.hostname,
      port: proxyUrlObj.port,
      method: 'CONNECT',
      path: 'elements.envato.com:443',
      headers: {
        'Proxy-Authorization': 'Basic ' + Buffer.from(`${proxyUsername}:${proxyPassword}`).toString('base64')
      },
      timeout: 5000
    };

    const req = https.request(options);
    
    req.on('connect', (res, socket) => {
      if (res.statusCode === 200) {
        socket.destroy();
        resolve(true);
      } else {
        reject(new Error(`Proxy connection failed with status: ${res.statusCode}`));
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Proxy connection timed out'));
    });

    req.on('error', (error) => {
      reject(new Error(`Proxy connection error: ${error.message}`));
    });

    req.end();
  });
};

const initializeBrowser = async (proxyUrl) => {
  try {
    // First, test direct proxy connection
    console.log('Testing direct proxy connection...');
    await testDirectProxy(proxyUrl);
    console.log('Direct proxy connection successful');

    const proxyUrlObj = new URL(proxyUrl);
    const formattedProxy = `${proxyUrlObj.protocol}//${proxyUrlObj.host}`;

    const launchOptions = {
      headless: true,
      args: [
        `--proxy-server=${formattedProxy}`,
        '--disable-images',
        '--disable-media',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      executablePath: process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
      ignoreHTTPSErrors: true
    };

    console.log('Launching browser with options:', {
      proxy: formattedProxy,
      args: launchOptions.args
    });

    const browser = await puppeteer.launch(launchOptions);
    return browser;
  } catch (error) {
    console.error('Browser initialization failed:', error);
    throw error;
  }
};

const validateProxy = async (page) => {
  try {
    console.log('Starting proxy validation...');
    
    // Set up verbose logging for requests
    page.on('request', request => {
      console.log(`Request: ${request.url()} [${request.method()}]`);
    });

    page.on('requestfailed', request => {
      console.log(`Failed request: ${request.url()}`);
      console.log('Error:', request.failure().errorText);
    });

    // Test basic connection
    console.log('Testing connection to httpbin...');
    await page.goto('http://httpbin.org/ip', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    const ipContent = await page.content();
    console.log('IP test response:', ipContent);

    // Test target site connection
    console.log('Testing connection to target site...');
    await page.goto('https://elements.envato.com', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    const targetContent = await page.evaluate(() => document.documentElement.outerHTML);
    if (!targetContent.includes('envato')) {
      throw new Error('Target site content validation failed');
    }

    return true;
  } catch (error) {
    console.error('Proxy validation failed:', error);
    throw error;
  }
};

const scrapeLogic = async (res, url, cookieValue, proxyUrl) => {
  let browser = null;
  let page = null;

  try {
    // Initialize browser with detailed logging
    console.log('Initializing browser...');
    browser = await initializeBrowser(proxyUrl);
    
    // Create new page
    console.log('Creating new page...');
    page = await browser.newPage();
    
    // Set comprehensive error handling
    page.on('error', err => console.error('Page error:', err));
    page.on('pageerror', err => console.error('Page error:', err));
    page.on('console', msg => console.log('Page console:', msg.text()));

    // Configure page settings
    await page.setViewport({ width: 1280, height: 800 });
    await page.setDefaultNavigationTimeout(60000);
    
    // Set up authentication
    console.log('Setting up proxy authentication...');
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword
    });

    // Validate proxy setup
    console.log('Validating proxy setup...');
    await validateProxy(page);

    // Continue with your existing scraping logic...
    // [Previous scraping code here]

  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    if (error.message.includes('net::ERR_PROXY_CONNECTION_FAILED')) {
      res.status(500).send({
        error: 'Proxy connection failed',
        details: 'Please check proxy credentials and connectivity',
        message: error.message
      });
    } else {
      res.status(500).send({
        error: 'Scraping failed',
        details: error.message,
        stack: error.stack
      });
    }
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
};

module.exports = { scrapeLogic };
