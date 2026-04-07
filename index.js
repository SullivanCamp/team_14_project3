const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

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

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());

// Pages
app.get("/", (req, res) => {
  res.render("customerhome");
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

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  console.log(`Order page: http://localhost:${port}/order`);
});