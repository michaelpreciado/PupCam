import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Analyze endpoint for dog mood detection
app.post('/analyze', async (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Call GPT-4o vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a veterinary behavioral expert specializing in canine emotion recognition. Analyze the dog's facial expression and body language in the image. 

Determine the dog's primary emotional state from these categories:
- happy: Content, relaxed, tail wagging, bright eyes
- relaxed: Calm, peaceful, resting comfortably  
- anxious: Worried, tense, showing stress signals
- fearful: Scared, cowering, wide eyes, defensive posture
- angry: Aggressive, tense, showing dominance or threat signals
- confused: Puzzled, head tilted, uncertain expression

Output JSON only with this exact structure:
{
  "mood": "one of the above moods",
  "confidence": "percentage as integer from 1-100"
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this dog's mood and emotional state."
            },
            {
              type: "image_url",
              image_url: {
                url: imageData
              }
            }
          ]
        }
      ],
      max_tokens: 100
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Validate the response structure
    if (!result.mood || !result.confidence) {
      throw new Error('Invalid response format from AI');
    }

    res.json(result);
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🐕 PupCam Mood Reader server running on http://localhost:${PORT}`);
  console.log(`📱 Open the app in your browser to start scanning dog moods!`);
}); 