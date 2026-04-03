const express = require("express");
require("dotenv").config();

const ordersRoute = require("./routes/orders");
const menuDataRoute = require("./routes/menuData");
const reportsRoute = require("./routes/reports");

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("customerhome");
});

app.get("/weather", (req, res) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=College Station&aqi=no`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => res.json({ temp: data.current.temp_f }))
    .catch(() => res.status(500).json({ error: "Weather fetch failed" }));
});

app.get("/order", (req, res) => {
  res.render("menu");
});

app.get("/checkout", (req, res) => {
  res.render("CheckoutPage");
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

app.use("/menu-data", menuDataRoute);
app.use("/api/orders", ordersRoute);
app.use("/api/reports", reportsRoute);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});