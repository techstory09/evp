const puppeteer = require("puppeteer");
require("dotenv").config();

const proxyUsername = 'msnmmayl';
const proxyPassword = '626he4yucyln';

let browser; // Singleton browser instance

const initializeBrowser = async (proxy) => {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=${proxy}`,
        '--disable-images',
        '--disable-media'
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
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

    // Set up request interception
    await page.setRequestInterception(true);

  

    page.on('request', request => {
      if (['image', 'media'].includes(request.resourceType())) {
        request.abort();
      } else if (request.url().includes('envatousercontent.com')) {
        intercepted = true; // Mark interception as done
        console.log('Intercepted request URL:', request.url());
        res.send(request.url());
        request.abort();
        return;
      } else {
        request.continue();
      }
    });

    // Authenticate proxy
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword,
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

    // Try to find and click the "Accept all" button
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

    // Wait for the element containing the text to load
    await page.waitForSelector('.woNBXVXX');

    // Extract the text content
    const text = await page.evaluate(() => {
      return document.querySelector('.woNBXVXX').innerText;
    });

    console.log('Extracted Text:', text);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    // Click the button
    await page.click('.ncWzoxCr.WjwUaJcT.NWg5MVVe.METNYJBx');
    console.log('Button clicked!');

    // Wait for the download button and click it
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
