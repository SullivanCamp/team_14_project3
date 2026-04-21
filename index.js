const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const { TranslationServiceClient } = require("@google-cloud/translate").v3;

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");

const translationClient = new TranslationServiceClient({
  credentials,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
});

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD,
  port: Number(process.env.PSQL_PORT),
  ssl: { rejectUnauthorized: false }
});

process.on("SIGINT", function () {
  pool.end();
  console.log("Application successfully shutdown");
  process.exit(0);
});

const ordersRoute = require("./routes/orders");
const menuDataRoute = require("./routes/menuData");
const reportsRoute = require("./routes/reports");
const inventoryMgmtRoute = require("./routes/inventoryMgmt");
const employeesMgmtRoute = require("./routes/employeesMgmt");
const menuMgmtRoute = require("./routes/menuMgmt");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pages
app.get("/", (req, res) => {
  res.render("login");
});

app.get("/reports", (req, res) => {
  res.render("reportshome");
});

app.get("/reports/product-usage", (req, res) => {
  res.render("productUsage");
});

app.get("/customerhome", (req, res) => {
  res.render("customerhome");
});

// app.get("/auth", (req, res) => {
//   res.render("auth");
// });

app.get("/managerhome", (req, res) => {
  res.render("managerhome");
});

app.get("/management", (req, res) => {
  res.render("managementhome");
});

app.get("/order", (req, res) => {
  res.render("menu");
});

app.get("/checkout", (req, res) => {
  res.render("CheckoutPage");
});

app.get("/cashier", (req, res) => {
  res.render("cashier");
});

app.get("/reports/x", (req, res) => {
  res.render("x-report");
});

app.get("/reports/z", (req, res) => {
  res.render("z-report");
});

app.get("/reports/trends", (req, res) => {
  res.render("order-trends");
});

app.get("/login", (req, res) => {
  res.render("login");
});


app.get("/inventorymanagement", (req, res) => {
  inventory = [];
  lowStockItems = [];
  pool
    .query("SELECT * FROM inventory_item ORDER BY inventory_item_id ASC")
    .then((result) => {
      inventory = result.rows;
      lowStockItems = inventory.filter((item) => item.current_amount / item.max_amount <= .3);
      res.render("inventorymanagement", {inventory, lowStockItems});
    })
    .catch(() => {
      res.status(500).json({ error: "Database query failed" });
    });
});

app.get("/employeemanagement", (req, res) => {
  employees = [];
  pool
    .query("SELECT * FROM employee ORDER BY employee_id ASC")
    .then((result) => {
      employees = result.rows;
      res.render("employeemanagement", {employees});
    })
    .catch(() => {
      res.status(500).json({ error: "Database query failed" });
    });
});

app.get("/menumanagement", async (req, res) => {
    try {
        const [menuRes, inventoryRes, ingredientsRes] = await Promise.all([
            pool.query(`SELECT * FROM menu_item WHERE item_id < 200 ORDER BY item_id ASC`),
            pool.query(`SELECT * FROM inventory_item WHERE inventory_item_id < 500 ORDER BY inventory_item_id ASC`),
            pool.query(`SELECT * FROM inventory_menu ORDER BY menu_item_id ASC`)
        ]);

        res.render("menumanagement", {
            menuItems: menuRes.rows,
            inventory: inventoryRes.rows,
            ingredients: ingredientsRes.rows
        });
    } catch (err) {
        res.status(500).json({ error: "Database query failed" });
    }
});


// Weather
app.get("/weather", (req, res) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=College Station&aqi=no`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => res.json({ temp: data.current.temp_f }))
    .catch(() => res.status(500).json({ error: "Weather fetch failed" }));
});

// Routes
app.use("/menu-data", menuDataRoute);
app.use("/orders", ordersRoute);
app.use("/api/orders", ordersRoute);
app.use("/api/reports", reportsRoute);
app.use("/api/inventoryMgmt", inventoryMgmtRoute);
app.use("/api/employeesMgmt", employeesMgmtRoute);
app.use("/api/menuMgmt", menuMgmtRoute);

app.post("/api/translate", async (req, res) => {
  try {
    const { texts, targetLanguage, sourceLanguage } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: "texts must be a non-empty array" });
    }

    if (!targetLanguage) {
      return res.status(400).json({ error: "targetLanguage is required" });
    }

    const parent = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/global`;

    const request = {
      parent,
      contents: texts,
      mimeType: "text/plain",
      targetLanguageCode: targetLanguage
    };

    if (sourceLanguage) {
      request.sourceLanguageCode = sourceLanguage;
    }

    const [response] = await translationClient.translateText(request);

    res.json({
      translatedTexts: (response.translations || []).map(t => t.translatedText || "")
    });
  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ error: "Translation failed" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  console.log(`Kiosk auth page: http://localhost:${port}/login`);
  console.log(`Order page: http://localhost:${port}/order`);
});