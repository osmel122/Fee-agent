require('dotenv').config();  // Load environment variables

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const pdfParse = require('pdf-parse');  // Added PDF parsing library

// Initialize the app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// File upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Only PDF files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Ensure the upload directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// File Upload Route
app.post('/fileup', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log(`File uploaded: ${req.file.path}`);
    res.json({ message: 'File uploaded successfully', filePath: req.file.path });

    try {
        // Read the PDF file and extract its text
        const pdfBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(pdfBuffer);
        const extractedText = data.text;  // The text extracted from the PDF

        console.log('Extracted Text:', extractedText);

        // Send the extracted text to OpenAI for review
        const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are an AI agent that reviews PDF files and provides feedback.' },
                { role: 'user', content: `Please review the following PDF content: ${extractedText}` },
            ],
        }, {
            headers: {
                Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const responseMessage = aiResponse.data.choices[0].message.content;
        console.log('AI Response:', responseMessage); // Log the response from OpenAI

        res.json({ message: 'File uploaded and processed successfully', reply: responseMessage });

    } catch (error) {
        console.error('Error in file processing:', error.response?.data || error.message);
        res.status(500).json({ error: 'Unable to process the uploaded file' });
    }
});

// Chat Route
app.post('/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const aiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4',
            messages: [{ role: 'user', content: message }],
        }, {
            headers: {
                Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('AI Response:', aiResponse.data);

        const responseMessage = aiResponse.data.choices[0].message.content;
        res.json({ reply: responseMessage });

    } catch (error) {
        console.error('Error in AI request:', error.response?.data || error.message);
        res.status(500).json({ error: 'Unable to generate a response from AI' });
    }
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
