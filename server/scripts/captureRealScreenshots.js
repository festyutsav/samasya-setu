const puppeteer = require("puppeteer-core");
const path = require("path");
const http = require("http");

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = path.join(__dirname, "../../docs/screenshots");

function postLogin(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const req = http.request(
      {
        hostname: "localhost",
        port: 5001,
        path: "/api/auth/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data)
        }
      },
      res => {
        let body = "";
        res.on("data", chunk => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error("Invalid JSON: " + body));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("1. Authenticating Admin & Partner via API...");
  const adminAuth = await postLogin("admin@example.com", "admin123");
  console.log("Admin authenticated:", adminAuth.user?.name);

  const partnerAuth = await postLogin("birla_institute_of_technology_mesra@edu.in", "bitm@2025");
  console.log("Partner authenticated:", partnerAuth.user?.name);

  console.log("2. Launching Headless Chrome...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--window-size=1440,900"
    ]
  });

  // SCREENSHOT 1: Landing Page
  console.log("Capturing 1: Landing Page...");
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page1.goto("http://localhost:5173/", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1200));
  await page1.screenshot({ path: path.join(OUTPUT_DIR, "landing_page.png") });
  console.log("Saved: landing_page.png");
  await page1.close();

  // SCREENSHOT 2: Admin Dashboard
  console.log("Capturing 2: Admin Dashboard...");
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page2.evaluateOnNewDocument(
    (user, token) => {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
    },
    adminAuth.user,
    adminAuth.token
  );
  await page2.goto("http://localhost:5173/", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 2000));
  await page2.screenshot({ path: path.join(OUTPUT_DIR, "admin_dashboard.png") });
  console.log("Saved: admin_dashboard.png");
  await page2.close();

  // SCREENSHOT 3: University / Partner Workspace
  console.log("Capturing 3: University / Partner Workspace...");
  const page3 = await browser.newPage();
  await page3.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page3.evaluateOnNewDocument(
    (user, token) => {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
    },
    partnerAuth.user,
    partnerAuth.token
  );
  await page3.goto("http://localhost:5173/", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 2000));
  await page3.screenshot({ path: path.join(OUTPUT_DIR, "collaboration_workspace.png") });
  console.log("Saved: collaboration_workspace.png");
  await page3.close();

  // SCREENSHOT 4: Problem Details & Resolution Proof
  console.log("Capturing 4: Resolution Proof / Problem Details...");
  const page4 = await browser.newPage();
  await page4.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page4.evaluateOnNewDocument(
    (user, token) => {
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
    },
    adminAuth.user,
    adminAuth.token
  );
  await page4.goto("http://localhost:5173/", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 1500));
  // Find first problem card or button to view details
  const detailBtn = await page4.$("button, a");
  if (detailBtn) {
    try {
      const cards = await page4.$$("button");
      for (const btn of cards) {
        const text = await (await btn.getProperty("textContent")).jsonValue();
        if (text && (text.includes("View") || text.includes("Details") || text.includes("Review"))) {
          await btn.click();
          break;
        }
      }
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {}
  }
  await page4.screenshot({ path: path.join(OUTPUT_DIR, "resolution_proof.png") });
  console.log("Saved: resolution_proof.png");
  await page4.close();

  await browser.close();
  console.log("ALL 4 REAL SCREENSHOTS CAPTURED SUCCESSFULLY!");
}

run().catch(err => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
