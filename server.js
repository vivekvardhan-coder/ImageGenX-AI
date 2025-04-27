require('dotenv').config();
const express = require("express");
const cors = require("cors");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require("path");

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5000', 'http://127.0.0.1:5000'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Validate API token on startup
const API_TOKEN = process.env.HUGGING_FACE_API_TOKEN;
if (!API_TOKEN) {
  console.error("❌ HUGGING_FACE_API_TOKEN is not set in environment variables");
  process.exit(1);
}

// Rate limiting
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50
});
app.use(limiter);

// API endpoint
app.post("/generate", async (req, res) => {
  try {
    const { prompt, style } = req.body;
    
    if (!prompt || !style) {
      return res.status(400).json({ error: "Prompt and style are required" });
    }

    console.log(`Generating image for: "${prompt}" (${style} style)`);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          inputs: `${prompt}, ${style} style, high quality, detailed`,
          options: { wait_for_model: true }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      return res.status(response.status).json({ 
        error: errorData.error || "Image generation failed",
        details: errorData
      });
    }

    const imageBuffer = await response.buffer();
    res.set('Content-Type', 'image/jpeg');
    res.send(imageBuffer);
    
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});