const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.PSQL_USER,
  host: process.env.PSQL_HOST,
  database: process.env.PSQL_DATABASE,
  password: process.env.PSQL_PASSWORD,
  port: Number(process.env.PSQL_PORT),
  ssl: { rejectUnauthorized: false }
});

function getDayBounds(dateString) {
  const day = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  const year = day.getFullYear();
  const month = String(day.getMonth() + 1).padStart(2, "0");
  const date = String(day.getDate()).padStart(2, "0");

  const start = `${year}-${month}-${date} 00:00:00`;

  const endDate = new Date(day);
  endDate.setDate(endDate.getDate() + 1);

  const endYear = endDate.getFullYear();
  const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
  const endDay = String(endDate.getDate()).padStart(2, "0");

  const end = `${endYear}-${endMonth}-${endDay} 00:00:00`;

  return {
    start,
    end,
    dayString: `${year}-${month}-${date}`
  };
}

async function ensureZReportTable(clientOrPool = pool) {
  await clientOrPool.query(`
    CREATE TABLE IF NOT EXISTS z_reports (
      id SERIAL PRIMARY KEY,
      report_date DATE NOT NULL UNIQUE,
      generated_by TEXT NOT NULL,
      generated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'America/Chicago'),
      order_count INTEGER NOT NULL DEFAULT 0,
      total_sales NUMERIC(10, 2) NOT NULL DEFAULT 0,
      avg_order NUMERIC(10, 2) NOT NULL DEFAULT 0,
      payment_totals JSONB NOT NULL DEFAULT '[]'::jsonb
    )
  `);
}

async function buildZReport(clientOrPool, start, end) {
  const totalsSql = `
    SELECT COUNT(*) AS c,
           COALESCE(SUM(total_price), 0) AS s,
           COALESCE(AVG(total_price), 0) AS a
    FROM orders
    WHERE order_datetime::timestamp >= $1
      AND order_datetime::timestamp < $2
      AND is_complete = true
  `;

  const paymentSql = `
    SELECT COALESCE(NULLIF(TRIM(payment_method), ''), 'Unknown') AS method,
           COALESCE(SUM(total_price), 0) AS total
    FROM orders
    WHERE order_datetime::timestamp >= $1
      AND order_datetime::timestamp < $2
      AND is_complete = true
    GROUP BY COALESCE(NULLIF(TRIM(payment_method), ''), 'Unknown')
    ORDER BY method
  `;

  const [totalsResult, paymentResult] = await Promise.all([
    clientOrPool.query(totalsSql, [start, end]),
    clientOrPool.query(paymentSql, [start, end])
  ]);

  const totalsRow = totalsResult.rows[0] || { c: 0, s: 0, a: 0 };

  return {
    orderCount: Number(totalsRow.c || 0),
    totalSales: Number(totalsRow.s || 0),
    avgOrder: Number(totalsRow.a || 0),
    paymentTotals: paymentResult.rows.map((row) => ({
      method: row.method || "Unknown",
      total: Number(row.total || 0)
    }))
  };
}

function reportFromGeneratedRow(row) {
  return {
    orderCount: Number(row.order_count || 0),
    totalSales: Number(row.total_sales || 0),
    avgOrder: Number(row.avg_order || 0),
    paymentTotals: Array.isArray(row.payment_totals) ? row.payment_totals : []
  };
}

router.get("/x", async (req, res) => {
  try {
    const { start, end, dayString } = getDayBounds(req.query.date);

    const sql = `
      SELECT
        EXTRACT(HOUR FROM o.order_datetime::timestamp) AS hr,
        COALESCE(SUM(CASE WHEN o.is_complete THEN o.total_price ELSE 0 END), 0) AS sales,
        COALESCE(SUM(CASE WHEN NOT o.is_complete THEN 1 ELSE 0 END), 0) AS voids
      FROM orders o
      WHERE o.order_datetime::timestamp >= $1
        AND o.order_datetime::timestamp < $2
      GROUP BY hr
      ORDER BY hr
    `;

    const result = await pool.query(sql, [start, end]);

    const rows = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sales: 0,
      voids: 0,
      returns: 0,
      discards: 0
    }));

    for (const row of result.rows) {
      const hour = Number(row.hr);
      if (hour >= 0 && hour < 24) {
        rows[hour] = {
          hour,
          sales: Number(row.sales),
          voids: Number(row.voids),
          returns: 0,
          discards: 0
        };
      }
    }

    const totals = rows.reduce(
      (acc, row) => {
        acc.sales += row.sales;
        acc.voids += row.voids;
        return acc;
      },
      { sales: 0, voids: 0 }
    );

    res.json({
      success: true,
      date: dayString,
      rows,
      totals
    });
  } catch (error) {
    console.error("Failed to load X report:", error);
    res.status(500).json({ success: false, error: "Failed to load X report." });
  }
});

router.get("/z/today", async (req, res) => {
  try {
    await ensureZReportTable();

    const { start, end, dayString } = getDayBounds(req.query.date);

    const generatedResult = await pool.query(
      `
      SELECT order_count, total_sales, avg_order, payment_totals, generated_by, generated_at
      FROM z_reports
      WHERE report_date = $1::date
      LIMIT 1
      `,
      [dayString]
    );

    if (generatedResult.rows.length > 0) {
      const generated = generatedResult.rows[0];

      return res.json({
        success: true,
        date: dayString,
        alreadyGenerated: true,
        generatedBy: generated.generated_by,
        generatedAt: generated.generated_at,
        report: reportFromGeneratedRow(generated)
      });
    }

    const report = await buildZReport(pool, start, end);

    return res.json({
      success: true,
      date: dayString,
      alreadyGenerated: false,
      report
    });
  } catch (error) {
    console.error("Failed to load Z report:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load Z report."
    });
  }
});

router.post("/z/generate", async (req, res) => {
  const client = await pool.connect();

  try {
    const generatedBy = String(req.body.generatedBy || "").trim() || "Manager";
    const { start, end, dayString } = getDayBounds(req.body.date);

    await client.query("BEGIN");
    await ensureZReportTable(client);

    const existingResult = await client.query(
      `
      SELECT order_count, total_sales, avg_order, payment_totals, generated_by, generated_at
      FROM z_reports
      WHERE report_date = $1::date
      FOR UPDATE
      `,
      [dayString]
    );

    if (existingResult.rows.length > 0) {
      await client.query("COMMIT");

      const existing = existingResult.rows[0];

      return res.json({
        success: true,
        date: dayString,
        alreadyGenerated: true,
        generatedBy: existing.generated_by,
        generatedAt: existing.generated_at,
        message: "Today's Z report has already been generated.",
        report: reportFromGeneratedRow(existing)
      });
    }

    const report = await buildZReport(client, start, end);

    const insertResult = await client.query(
      `
      INSERT INTO z_reports (
        report_date,
        generated_by,
        order_count,
        total_sales,
        avg_order,
        payment_totals
      )
      VALUES ($1::date, $2, $3, $4, $5, $6::jsonb)
      RETURNING generated_at
      `,
      [
        dayString,
        generatedBy,
        report.orderCount,
        report.totalSales,
        report.avgOrder,
        JSON.stringify(report.paymentTotals)
      ]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      date: dayString,
      alreadyGenerated: true,
      generatedBy,
      generatedAt: insertResult.rows[0].generated_at,
      report
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Failed to generate Z report:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate Z report."
    });
  } finally {
    client.release();
  }
});

router.get("/trends", async (req, res) => {
  try {
    const { start, end } = getDayBounds(req.query.date);

    const totalsSql = `
      SELECT COUNT(*) AS total_orders,
             COALESCE(SUM(total_price), 0) AS total_revenue
      FROM orders
      WHERE order_datetime >= $1 AND order_datetime < $2
    `;

    const result = await pool.query(totalsSql, [start, end]);

    res.json({
      success: true,
      totalOrders: Number(result.rows[0].total_orders),
      totalRevenue: Number(result.rows[0].total_revenue)
    });
  } catch (error) {
    console.error("Failed to load trends:", error);
    res.status(500).json({ success: false });
  }
});

router.get("/product-usage", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Missing dates" });
  }

  try {
    const query = `
      SELECT 
        ii.inventory_item_id, 
        ii.name, 
        ii.measurement_units, 
        SUM(oi.quantity * im.quantity_used) AS total_used
      FROM orders o
      JOIN order_item oi ON oi.order_id = o.id
      JOIN inventory_menu im ON im.menu_item_id = oi.menu_id
      JOIN inventory_item ii ON ii.inventory_item_id = im.inventory_item_id
      WHERE o.order_datetime >= $1
      AND o.order_datetime < $2
      AND o.is_complete = TRUE
      GROUP BY ii.inventory_item_id, ii.name, ii.measurement_units
      ORDER BY total_used DESC;
    `;

    const result = await pool.query(query, [
      `${startDate} 00:00:00`,
      `${endDate} 23:59:59`
    ]);

    res.json(result.rows);
  } catch (err) {
    console.error("Product usage error:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

module.exports = router;