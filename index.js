const express = require("express");
require("dotenv").config();

const ordersRoute = require("./routes/orders");

// Create express app
const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());

app.use("/", ordersRoute);

// default to customer home page
app.get("/", (req, res) => {
  res.render("customerhome");
});

// Weather data access
app.get("/weather", (req, res) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=College Station&aqi=no`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => res.json({ temp: data.current.temp_f }))
    .catch(() => res.status(500).json({ error: "Weather fetch failed" }));
});

// Menu data access
const menuDataRoute = require("./routes/menuData");
app.use("/menu-data", menuDataRoute);


app.get('/order', (req, res) => {
    // add whatever data is needed from db
    // teammembers = []
    // pool
    //     .query('SELECT * FROM teammembers;')
    //     .then(query_res => {
    //         for (let i = 0; i < query_res.rowCount; i++){
    //             teammembers.push(query_res.rows[i]);
    //         }
    //         const data = {teammembers: teammembers};
    //         console.log(teammembers);
    //         res.render('order', data);
    //     });
    res.render('menu');
});

app.get("/checkout", (req, res) => {
  res.render("CheckoutPage");
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}/customerhome`);
});