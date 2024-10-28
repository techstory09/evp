const puppeteer = require("puppeteer");
require("dotenv").config();

const proxyUsername = 'msnmmayl';
const proxyPassword = '626he4yucyln';

let browser; // Singleton browser instance

const initializeBrowser = async (proxy) => {
  if (!browser) {
    // Parse and format proxy URL properly
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
  console.log('Browser initialized2');
  return browser;
};

const scrapeLogic = async (res, url, cookieValue, proxy) => {
  try {
    const browser = await initializeBrowser(proxy);
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Authenticate proxy BEFORE setting request interception
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword,
    });

    // Set up request interception
    await page.setRequestInterception(true);
    
    let intercepted = false; // Define intercepted variable

    page.on('request', request => {
      if (['image', 'media'].includes(request.resourceType())) {
        request.abort();
      } else if (request.url().includes('preview.mp3')){
         request.continue();
      }else if (request.url().includes('envatousercontent.com')) {
        intercepted = true; // Mark interception as done
        console.log('Intercepted request URL:', request.url());
        res.send(request.url());
        request.abort();
        return;
       
      } else {
        request.continue();
      }
    });

    console.log('Page loaded1');
    // Set cookies
    await page.setCookie({
      name: '_elements_session_4', // Hardcoded cookie name
      value: cookieValue, // Dynamic cookie value from query parameter
      domain: '.elements.envato.com', // Adjust the domain to match the target site
    });

    console.log('Page loaded2');
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('Page loaded');

    // Rest of your code remains exactly the same...
    try {
      await page.waitForFunction(() =>
        Array.from(document.querySelectorAll('button, a'))
          .some(el => el.textContent.trim() === 'Accept all'),
        { timeout: 5000 } // Adjust timeout as needed
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
  } catch (e) {
    console.error(e);
    res.send(`Something went wrong while running : ${e}`);
  } finally {
    // Optionally close the browser if needed, but keeping it open for speed
    // await browser.close();
  }
};

module.exports = { scrapeLogic };
