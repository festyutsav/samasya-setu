const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

async function generateIcons() {
  const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!fs.existsSync(chromePath)) {
    console.error("Chrome not found at:", chromePath);
    process.exit(1);
  }

  const svgPath = path.resolve(__dirname, "../../client/public/favicon.svg");
  const svgContent = fs.readFileSync(svgPath, "utf8");
  const base64Svg = Buffer.from(svgContent).toString("base64");
  const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;

  console.log("Launching Chrome to render PWA PNG icons...");
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const targets = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "favicon-32x32.png", size: 32 },
  ];

  for (const target of targets) {
    await page.setViewport({
      width: target.size,
      height: target.size,
      deviceScaleFactor: 2,
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: ${target.size}px;
              height: ${target.size}px;
              overflow: hidden;
              background: transparent;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 200));
    const outPath = path.resolve(__dirname, "../../client/public", target.name);
    await page.screenshot({
      path: outPath,
      type: "png",
      omitBackground: true,
    });

    console.log(`✓ Generated ${target.name} (${target.size}x${target.size}) -> ${outPath}`);
  }

  await browser.close();
  console.log("All PWA PNG icons generated successfully!");
}

generateIcons().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
