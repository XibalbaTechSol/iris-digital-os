const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database/iris_core.db');
const db = new sqlite3.Database(dbPath);

const dummyPDF = 'JVBERi0xLjQKJScAAAAr';

db.serialize(() => {
    db.run("UPDATE documents SET content_base64 = ? WHERE content_base64 IS NULL", [dummyPDF], (err) => {
        if (err) {
            console.error("Update failed", err.message);
        } else {
            console.log("Updated documents with dummy content.");
        }
    });
});

db.close();
