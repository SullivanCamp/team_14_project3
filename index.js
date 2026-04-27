const express = require("express");
const session = require("express-session");
const { Pool } = require("pg");
require("dotenv").config();

const ordersRoute = require("./routes/orders");
const menuDataRoute = require("./routes/menuData");
const reportsRoute = require("./routes/reports");
const addonPopupRoute = require("./routes/addonpopup");


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

const inventoryMgmtRoute = require("./routes/inventoryMgmt");
const employeesMgmtRoute = require("./routes/employeesMgmt");
const menuMgmtRoute = require("./routes/menuMgmt");
const userAuthRoute = require("./routes/userauth");
const aiRoute = require("./routes/chatbot");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false
    }
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  next();
});

app.get("/", (req, res) => {
  res.render("login", {
    user: req.session && req.session.user ? req.session.user : null
  });
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

app.get("/auth", (req, res) => {
  res.render("auth");
});

app.get("/managerhome", (req, res) => {
  res.render("managerhome");
});

app.get("/management", (req, res) => {
  res.render("managementhome");
});

app.get("/order", (req, res) => {
  res.render("menu", {
    user: req.session && req.session.user ? req.session.user : null
  });
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
  res.render("login", {
    user: req.session && req.session.user ? req.session.user : null
  });
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

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Routes
app.use("/auth", userAuthRoute);
app.use("/menu-data", menuDataRoute);
app.use("/orders", ordersRoute);
app.use("/api/orders", ordersRoute);
app.use("/api/reports", reportsRoute);
app.use("/addonpopup", addonPopupRoute);
app.use("/api/inventoryMgmt", inventoryMgmtRoute);
app.use("/api/employeesMgmt", employeesMgmtRoute);
app.use("/api/menuMgmt", menuMgmtRoute);
app.use("/api/ask-ai", aiRoute);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  console.log(`Kiosk auth page: http://localhost:${port}/auth`);
  console.log(`Order page: http://localhost:${port}/order`);
});