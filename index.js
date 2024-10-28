const express = require("express");
const { scrapeLogic } = require("./scrapeLogic");
const { scrapeLogic2 } = require("./scrapeLogic2");
const app = express();

const PORT = process.env.PORT || 4000;

app.get("/scrape", (req, res) => {
  const { url, cookieValue, proxy } = req.query;
  scrapeLogic(res, url, cookieValue, proxy);
});

app.get("/scrape2", (req, res) => {
  const { url, cookieValue, proxy } = req.query;
  scrapeLogic2(res, url, cookieValue, proxy);
});


app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
