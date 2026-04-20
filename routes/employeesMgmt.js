const express = require("express");
const pool = require('../db'); 

const router = express.Router();

router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { submissionType, employee } = req.body;
    if (submissionType === "Edit") {
      const query = `
        UPDATE employee
        SET first_name = $1, last_name = $2, access_level = $3, pay_rate = $4, password = $5
        WHERE employee_id = $6`;
      await client.query(query, [
        employee.first_name,
        employee.last_name,
        employee.access_level,
        employee.pay_rate,
        employee.password,
        employee.employee_id
      ]);
    } else if (submissionType === "Delete") {
      const query = `DELETE FROM employee WHERE employee_id = $1`;
      await client.query(query, [employee.employee_id]);
    }
    else if (submissionType === "Add") {
        const query1 = `SELECT MAX(employee_id) AS max_id FROM employee`;
        const result = await client.query(query1);
        const newId = parseInt(result.rows[0].max_id) + 1;

        const query2 = `
            INSERT INTO employee (employee_id, first_name, last_name, access_level, pay_rate, password)
            VALUES ($1, $2, $3, $4, $5, $6)
            `;
        await client.query(query2, [
            newId,
            employee.first_name,
            employee.last_name,
            employee.access_level,
            employee.pay_rate,
            employee.password
        ]);
    }

    await client.query('COMMIT');

    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error processing employee request:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    client.release();
  }
});

module.exports = router;