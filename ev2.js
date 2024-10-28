const express = require('express')
const app = express()
const port = 8000
const puppeteer = require('puppeteer');


const proxy = 'http://23.247.105.131:5195';
const proxyUsername = 'msnmmayl';
const proxyPassword = '626he4yucyln';

app.get('/', (req, res) => {
    res.send('id: ' + req.query.id);

})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});


(async () => {



    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: '/tmp/user-data-diret5',
        defaultViewport: null,
        args: ['--start-maximized']
    });

      
        const url = 'https://elements.envato.com/logotype-modern-logo-font-4X4ER6T' ;

        const page = await browser.newPage();

        await page.authenticate({
            username: 'msnmmayl',
            password: '626he4yucyln',
          });

           // Set cookies
        await page.setCookie({
            name: '_elements_session_4',
            value: 'RGxUZHY1UyszTjNHZCtONXIxTzhyNWZuS2tIak1PMnB1RURiY1crSEZDeWRlWGtjeHJGeGZvRjBmRUZTT2ZUd201bjFVamZFK0pLSzI0MFBYNjBnNFFSWmcyWVdaTi8vVmlZbnY5L1JBQWdaUzU5L1lvbjQvLzJrU1RJT3FYSEZrdnJWRFBQSFJ1M0RXNlhhd3RJdU9RWklDcmtzd2xzSlpwQ2s4elJmUEFReHNKRi94UjFYQTBaaUVoQkM2MHlqYWtBT1MveGtEelQzRERrSzVTTXpaWEJzTTVUakluR1hWTEoycmcyRDlsa2VVVG1McktqSFFjOXdJdVEweUJod05Vc1UyWGFLVEtnTktOK3Y3aUV5VmE0WHQ5b3FVbzQzem9iZ043eXJpUE1yZHROTlRTakRkQWxCblhXNUpMYkhKLzBwL2ZWNTVxOGJvVWpnQlpyVkdYOEJ1MTl2MDJRblQrNVdPQi9YdStISjBWREJWK3F4c0EzK2hKMEZ1elVjdWgwMUFMdWJITUJzMmwzSHVBbktXdz09LS0xYlpyYkZZaHlwV09wWW5wMDBTNUdnPT0%3D--66b7f6885fa8f7f6955761c72808483e37f037fc',
            domain: '.elements.envato.com', // Adjust the domain to match the target site
        });
        await page.goto(url, { waitUntil: 'networkidle2' });


        
                // Wait for the element containing the text to load
                await page.waitForSelector('.woNBXVXX');

                // Extract the text content
                const text = await page.evaluate(() => {
                // Replace '.target-element-class' with the actual class, id, or selector of the element
                return document.querySelector('.woNBXVXX').innerText;
                });

                console.log('Extracted Text:', text);
                await page.keyboard.press('Escape');
                await page.keyboard.press('Escape');
                await page.keyboard.press('Escape');
                await page.keyboard.press('Escape');
                await page.keyboard.press('Escape');
                await page.keyboard.press('Escape');


                // Wait for the button to be available in the DOM
                await page.waitForSelector('.ncWzoxCr.WjwUaJcT.NWg5MVVe.METNYJBx');

                // Click the button
                await page.click('.ncWzoxCr.WjwUaJcT.NWg5MVVe.METNYJBx');

                console.log('Button clicked!');


   


            // Wait for the button to be available in the DOM
            await page.waitForSelector('[data-testid="download-without-license-button"]');
            console.log('Button clicked2!');

            // Click the button
            await page.click('[data-testid="download-without-license-button"]');

            console.log('Button clicked22!');


                // Set up request interception
                await page.setRequestInterception(true);

                page.on('request', request => {
                    const url = request.url();
                    if (url.includes('envatousercontent.com')) {
                        // Log the URL
                        console.log('Intercepted request URL:', url);
            
                        // Abort the request
                        request.abort();
                    } else {
                        // Allow the request to continue
                        request.continue();
                    }
                });
                // await browser.close();

   


})();


