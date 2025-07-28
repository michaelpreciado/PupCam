import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced mood analysis with detailed criteria
const MOOD_CRITERIA = {
  happy: "Relaxed facial muscles, mouth slightly open, tongue possibly visible, bright alert eyes, ears in natural position, overall relaxed body posture",
  relaxed: "Soft eyes, ears in natural position, mouth closed or slightly open, calm breathing, lying down or sitting comfortably, no tension in facial muscles",
  anxious: "Tense facial muscles, ears back or pinned, wide eyes, panting without heat, restless movement, avoiding eye contact, tucked tail",
  fearful: "Wide eyes showing whites, ears flat against head, cowering posture, trembling, tail tucked, trying to hide or escape",
  angry: "Raised lips showing teeth, wrinkled forehead, direct stare, ears forward, stiff body posture, growling expression",
  confused: "Head tilted, ears perked asymmetrically, questioning expression, alert but uncertain posture, focused attention"
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, feedback, sessionId } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Build enhanced system prompt with detailed criteria
    let systemPrompt = `You are a world-class veterinary behavioral expert with 20+ years of experience in canine emotion recognition and animal psychology.

TASK: Analyze the dog's emotional state using scientific behavioral markers.

MOOD CATEGORIES & CRITERIA:
${Object.entries(MOOD_CRITERIA).map(([mood, criteria]) => `• ${mood.toUpperCase()}: ${criteria}`).join('\n')}

ANALYSIS PROTOCOL:
1. Examine facial features: eyes, ears, mouth, nose, forehead
2. Assess body language: posture, tail position, muscle tension
3. Consider context clues: environment, lighting, positioning
4. Rate confidence based on clarity of behavioral markers

ACCURACY GUIDELINES:
- Only assign high confidence (80%+) when multiple clear indicators align
- Medium confidence (50-79%) for some clear indicators
- Low confidence (20-49%) for ambiguous or unclear signals
- Very low confidence (<20%) for poor image quality or mixed signals

OUTPUT FORMAT (JSON): {"mood": "exact category name", "confidence": number, "reasoning": "brief explanation of key indicators observed"}`;

    // Add learning context if feedback is provided
    if (feedback && feedback.corrections) {
      systemPrompt += `\n\nLEARNING CONTEXT: Previous analyses have been corrected as follows:
${feedback.corrections.map(c => `- Image similar to current: Was predicted as "${c.predicted}", but correct answer was "${c.actual}". Key difference: ${c.notes || 'User correction'}`).join('\n')}

Apply these learnings to improve accuracy.`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent results
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this dog's emotional state. Focus on the most prominent behavioral indicators and provide your confidence level."
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
      max_tokens: 200
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    if (!result.mood || !result.confidence) {
      throw new Error('Invalid response format from AI');
    }

    // Add metadata for learning
    result.timestamp = new Date().toISOString();
    result.sessionId = sessionId || 'anonymous';
    result.version = '2.0'; // Track prompt version

    res.json(result);
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
}
