const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();

// Create express app
const app = express();
const port = 3000;

// Create pool
const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: {rejectUnauthorized: false}
});

// Add process hook to shutdown pool
process.on('SIGINT', function() {
    pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});
	 	 	 	
app.set("view engine", "ejs");
app.use(express.static('public'));


// default to customer home page
app.get('/', (req, res) => {
    res.render('customerhome');
});



// Weather data access
app.get('/weather', (req, res) => {
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=College Station&aqi=no`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => res.json({ temp: data.current.temp_f }))
        .catch(error => res.status(500).json({ error: 'Weather fetch failed' }));
});


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

app.get('/checkout', (req, res) => {
    res.render('CheckoutPage');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}/customerhome`);
});
