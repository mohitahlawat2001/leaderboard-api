const express = require('express');
const mysql = require('mysql2/promise');
// use .env file to store the database credentials


const app = express();
const port = process.env.PORT || 3000; 

const dotenv = require('dotenv');
dotenv.config();


app.use(express.json());

// Replace with your actual MySQL connection details
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// API for current week leaderboard
app.get('/current-week-leaderboard', async (_, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leaderboard_data WHERE TimeStamp >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ORDER BY Score DESC, TimeStamp ASC LIMIT 200');
    res.json(rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API for last week leaderboard by country
app.get('/last-week-leaderboard/:country', async (req, res) => {
  try {
    const country = req.params.country.toUpperCase(); // Convert to uppercase for better matching
    const [rows] = await pool.query(
      ' SELECT * FROM leaderboard_data WHERE YEARWEEK(TimeStamp, 1) = YEARWEEK(CURDATE(), 1) - 1  AND Country = ? ORDER BY Score DESC LIMIT 200;', [country]  )
    res.json(rows);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API for fetching user rank
app.get('/user-rank/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const [rows] = await pool.query(
      ' WITH ranked_users AS ( SELECT UID, Name, Score, DENSE_RANK() OVER (ORDER BY Score DESC) AS ran FROM leaderboard_data ) SELECT ran as "Rank" FROM ranked_users  WHERE UID = ? ', [userId]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// handle invalid routes
app.use((_, res) => {
  res.status(404).json({ error: 'Not Found' });
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
