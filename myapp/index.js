const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 3000;

const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: Number(process.env.PSQL_PORT),
    ssl: { rejectUnauthorized: false }
});

process.on('SIGINT', function () {
    pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    const data = { name: 'Mario' };
    res.render('index', data);
});

app.get('/user', (req, res) => {
    const teammembers = [];

    pool.query('SELECT * FROM teammembers;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                teammembers.push(query_res.rows[i]);
            }

            const data = { teammembers };
            console.log(teammembers);
            res.render('users', data); // changed from 'user' to 'users'
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Database query failed');
        });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}/user`);
});