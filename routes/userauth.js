const express = require("express");
const bcrypt = require("bcrypt");
const pool = require('../db'); 

const router = express.Router();

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function getTierFromPoints(points) {
  const pts = Number(points) || 0;

  if (pts >= 300) return "Gold";
  if (pts >= 150) return "Silver";
  return "Standard";
}

router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "First name, email, and password are required."
      });
    }

    const existing = await pool.query(
      `
      SELECT id
      FROM customer_account
      WHERE email = $1 OR ($2 IS NOT NULL AND phone = $2)
      `,
      [email.trim(), phone?.trim() || null]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "That email or phone is already being used."
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO customer_account (first_name, last_name, email, phone, password_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, first_name, last_name, email, phone
      `,
      [
        firstName.trim(),
        lastName?.trim() || null,
        email.trim(),
        phone?.trim() || null,
        passwordHash
      ]
    );

    const user = result.rows[0];

    await pool.query(
      `
      INSERT INTO customer_rewards (customer_id, points, tier)
      VALUES ($1, 0, 'Standard')
      `,
      [user.id]
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        authType: "account"
      }
    });
  } catch (error) {
    console.error("Signup failed:", error);
    return res.status(500).json({
      success: false,
      error: "Signup failed."
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required."
      });
    }

    const result = await pool.query(
      `
      SELECT id, first_name, last_name, email, phone, password_hash
      FROM customer_account
      WHERE email = $1
      `,
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password."
      });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password."
      });
    }

    return res.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        authType: "account"
      }
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({
      success: false,
      error: "Login failed."
    });
  }
});

router.post("/skip", async (req, res) => {
  return res.json({
    success: true,
    message: "Continuing as guest.",
    user: {
      id: null,
      first_name: "Guest",
      last_name: "",
      email: null,
      phone: null,
      authType: "guest"
    }
  });
});

router.get("/rewards/:customerId", async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: "Valid customer ID is required."
      });
    }

    const result = await pool.query(
      `
      SELECT ca.id, ca.first_name, ca.last_name, ca.email, ca.phone,
             COALESCE(cr.points, 0) AS points,
             COALESCE(cr.tier, 'Standard') AS tier
      FROM customer_account ca
      LEFT JOIN customer_rewards cr
        ON cr.customer_id = ca.id
      WHERE ca.id = $1
      `,
      [customerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Customer not found."
      });
    }

    return res.json({
      success: true,
      customer: result.rows[0]
    });
  } catch (error) {
    console.error("Rewards lookup failed:", error);
    return res.status(500).json({
      success: false,
      error: "Rewards lookup failed."
    });
  }
});

router.get("/find-by-phone", async (req, res) => {
  try {
    const rawPhone = req.query.phone || "";
    const digits = normalizePhone(rawPhone);

    if (!digits) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required."
      });
    }

    const result = await pool.query(
      `
      SELECT ca.id, ca.first_name, ca.last_name, ca.email, ca.phone,
             COALESCE(cr.points, 0) AS points,
             COALESCE(cr.tier, 'Standard') AS tier
      FROM customer_account ca
      LEFT JOIN customer_rewards cr
        ON cr.customer_id = ca.id
      WHERE regexp_replace(COALESCE(ca.phone, ''), '\D', '', 'g') = $1
      `,
      [digits]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No customer found with that phone number."
      });
    }

    return res.json({
      success: true,
      customer: result.rows[0]
    });
  } catch (error) {
    console.error("Phone lookup failed:", error);
    return res.status(500).json({
      success: false,
      error: "Phone lookup failed."
    });
  }
});

module.exports = router;