const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'messages.json');

app.use(cors());
app.use(express.json());

// THIS LINE SERVES YOUR HTML FRONTEND
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

app.post('/api/contact', (req, res) => {
    const { name, company, email, brief, budget } = req.body;

    if (!name || !email || !brief) {
        return res.status(400).json({ error: 'Name, email, and brief are required.' });
    }

    const newMessage = {
        timestamp: new Date().toISOString(),
        name, company, email, brief, budget
    };

    fs.appendFile(DB_FILE, JSON.stringify(newMessage) + '\n', (err) => {
        if (err) return res.status(500).json({ error: 'Internal server error' });
        res.status(200).json({ success: true, message: 'Message saved successfully.' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});