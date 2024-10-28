const puppeteer = require("puppeteer");
require("dotenv").config();

const proxyUsername = 'msnmmayl';
const proxyPassword = '626he4yucyln';

let browser; // Singleton browser instance

const initializeBrowser = async (proxy) => {
  if (!browser) {
    const proxyUrl = new URL(proxy);
    const formattedProxy = `${proxyUrl.hostname}:${proxyUrl.port}`;

    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=${formattedProxy}`,
        '--disable-images',
        '--disable-media',
        '--ignore-certificate-errors',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
      ignoreHTTPSErrors: true
    });
    console.log('Browser initialized');
  }
  return browser;
};

const scrapeLogic = async (res, url, cookieValue, proxy) => {
  let responseSent = false; // Track if response was sent
  let page; // Declare page at the start

  try {
    const browser = await initializeBrowser(proxy);
    page = await browser.newPage(); // Initialize page here
    await page.setViewport({ width: 1280, height: 800 });

    // Authenticate proxy BEFORE setting request interception
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword,
    });

    // Set up request interception
    await page.setRequestInterception(true);

    page.on('request', request => {
      if (['image', 'media'].includes(request.resourceType())) {
        request.abort();
      } else if (request.url().includes('envatousercontent.com') && !responseSent) {
        responseSent = true; // Mark response as sent
        console.log('Intercepted request URL:', request.url());
        res.send(request.url());
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log('Page loaded1');
    // Set cookies
    await page.setCookie({
      name: '_elements_session_4', 
      value: cookieValue, 
      domain: '.elements.envato.com', 
    });

    console.log('Page loaded2');
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('Page loaded');

    try {
      await page.waitForFunction(() =>
        Array.from(document.querySelectorAll('button, a'))
          .some(el => el.textContent.trim() === 'Accept all'),
        { timeout: 5000 }
      );
      await page.evaluate(() => {
        const button = Array.from(document.querySelectorAll('button, a'))
          .find(el => el.textContent.trim() === 'Accept all');
        if (button) {
          button.click();
        }
      });
      console.log('"Accept all" button clicked');
    } catch (e) {
      console.log('"Accept all" button not found, continuing');
    }

    await page.waitForSelector('.woNBXVXX');
    const text = await page.evaluate(() => {
      return document.querySelector('.woNBXVXX').innerText;
    });
    console.log('Extracted Text:', text);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.click('.ncWzoxCr.WjwUaJcT.NWg5MVVe.METNYJBx');
    console.log('Button clicked!');
    await page.waitForSelector('[data-testid="download-without-license-button"]');
    await page.click('[data-testid="download-without-license-button"]');
    console.log('Download button clicked');
    console.log('Task completed successfully');

    if (!responseSent) {
      responseSent = true; // Set to true to ensure no double response
      res.send("Task completed successfully");
    }

  } catch (e) {
    console.error(e);
    if (!responseSent) {
      responseSent = true; // Ensure error response is sent only once
      res.send(`Something went wrong while running : ${e}`);
    }
  } finally {
    if (page) {
      await page.close(); // Close the page if it was initialized
    }
  }
};

module.exports = { scrapeLogic };
