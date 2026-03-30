require("dotenv").config();
const express = require("express");
const path = require("path");
const pool = require("./db");
const ordersRouter = require("./routes/orders");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "CheckoutPage.html"));
});

app.get("/test", (req, res) => {
  res.send("Express server is running.");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    res.json({
      success: true,
      message: "Database connection successful",
      time: result.rows[0].current_time
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.use("/api/orders", ordersRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});