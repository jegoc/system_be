var express = require('express');
var router = express.Router();
var db = require('../../db');

// Maximum record limit
const MAX_RECORDS = 500;

// ***** User Log ******

// API to Record User Data
router.post("/", (req, res) => {
    const { user_id, user_auth, page, ip, city, region, country, latitude, longitude, device, localTime } = req.body;

    if (!ip || !device || !localTime) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Insert the new record
    const insertQuery = `
        INSERT INTO user_tracking (user_id, user_auth, page, ip, city, region, country, latitude, longitude, device, local_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const insertValues = [user_id, user_auth, page, ip, city, region, country, latitude, longitude, device, localTime];

    db.query(insertQuery, insertValues, (err, results) => {
        if (err) {
            console.error("Error inserting user data:", err);
            return res.status(500).json({ error: "Failed to record user data." });
        }

        // Check the total record count
        const countQuery = `SELECT COUNT(*) AS count FROM user_tracking`;
        db.query(countQuery, (err, countResults) => {
            if (err) {
                console.error("Error counting records:", err);
                return res.status(500).json({ error: "Failed to count records." });
            }

            const recordCount = countResults[0].count;

            if (recordCount > MAX_RECORDS) {
                // Delete the oldest records to keep the limit
                const deleteQuery = `
                    DELETE FROM user_tracking
                    ORDER BY created_at ASC
                    LIMIT ?
                `;
                const deleteLimit = recordCount - MAX_RECORDS;

                db.query(deleteQuery, [deleteLimit], (err, deleteResults) => {
                    if (err) {
                        console.error("Error deleting old records:", err);
                        return res.status(500).json({ error: "Failed to delete old records." });
                    }
                    console.log(`Deleted ${deleteResults.affectedRows} old records.`);
                });
            }

            res.status(200).json({ message: "User data recorded successfully." });
        });
    });
});

// ***** Getting the data of logs *****
router.get('/log/', (req, res) => {
    const query = 'SELECT * FROM user_tracking ORDER BY created_at DESC';

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching logs' });
        }
        res.json(results);
    });
});

module.exports = router;

