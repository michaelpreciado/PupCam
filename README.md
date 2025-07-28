# 🐕📱 PupCam Mood Reader

**AI-powered dog mood analysis using your camera**

A minimal but polished Progressive Web App (PWA) that uses computer vision and GPT-4o to analyze your dog's emotional state in real-time.

![PupCam Demo](https://img.shields.io/badge/Demo-Live-brightgreen) ![PWA](https://img.shields.io/badge/PWA-Ready-blue) ![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-Enabled-orange)

## ✨ Features

- **🎥 Real-time Camera Interface**: Full-bleed camera view with frosted phone frame design
- **🤖 AI Dog Detection**: TensorFlow.js COCO-SSD model for real-time dog detection
- **🧠 Mood Analysis**: GPT-4o vision analysis for accurate emotional state detection
- **😊 Emotion Mapping**: 6 distinct moods with corresponding emojis
- **📱 Progressive Web App**: Installable, works offline, native app experience
- **🎨 Modern UI**: TailwindCSS 3 with dark/light mode support
- **📤 Social Sharing**: Web Share API integration
- **📳 Haptic Feedback**: Device vibration on successful scans
- **🔒 Privacy First**: All processing happens locally or on your server

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+**
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

### Installation

```bash
# Clone or download the project
cd PupCam

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`

### 📱 Mobile Usage

1. Open the app in your mobile browser
2. Grant camera permissions when prompted
3. Point camera at your dog
4. Tap the green scan button
5. Watch the AI analyze your pup's mood!
6. Share results with friends

## 🛠️ Tech Stack

### Frontend
- **Vanilla JavaScript ES6+** - Modern, lightweight
- **TailwindCSS 3** - Utility-first styling
- **TensorFlow.js** - Client-side ML inference
- **COCO-SSD Model** - Object detection for dogs

### Backend
- **Node.js 20** with ES modules
- **Express.js** - Web server framework
- **OpenAI SDK** - GPT-4o vision integration
- **CORS enabled** - Cross-origin requests

### PWA Features
- **Service Worker** - Offline caching
- **Web App Manifest** - App installation
- **Web Share API** - Native sharing
- **Responsive Design** - Works on all devices

## 📝 API Reference

### POST `/analyze`

Analyzes a dog image for mood detection.

**Request Body:**
```json
{
  "imageData": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "mood": "happy",
  "confidence": 95
}
```

**Supported Moods:**
- `happy` 😊 - Content, relaxed, tail wagging
- `relaxed` 😌 - Calm, peaceful, resting
- `anxious` 😟 - Worried, tense, stress signals
- `fearful` 😨 - Scared, cowering, defensive
- `angry` 😡 - Aggressive, dominant behavior
- `confused` 😕 - Puzzled, uncertain expression

## 🎨 UI/UX Features

### Camera Interface
- **Full-screen camera view** with environment camera preference
- **Frosted glass frame** mimicking modern phone design
- **Animated emerald scan line** during detection
- **Real-time detection overlay** with green bounding boxes

### Interaction Design
- **Circular scan button** with pulse animation
- **Haptic feedback** on successful detection (40ms vibration)
- **Flip-in animation** for mood result badges
- **Auto-hiding UI elements** for clean experience
- **Error handling** with visual feedback

### PWA Capabilities
- **Installable** on home screen
- **Offline-ready** with cached assets
- **Native app feel** with standalone display
- **Share integration** with device native sharing

## 🔧 Development

### Project Structure
```
PupCam/
├── server.js                 # Express server
├── package.json             # Dependencies & scripts
├── env.example              # Environment template
├── README.md                # This file
└── frontend/
    ├── index.html           # Main app interface
    ├── manifest.json        # PWA manifest
    ├── sw.js               # Service worker
    ├── js/
    │   └── app.js          # Main application logic
    └── icons/
        ├── generate-icons.html  # Icon generator
        └── icon-*.png          # PWA icons (to be generated)
```

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

### Generating PWA Icons
1. Open `frontend/icons/generate-icons.html` in your browser
2. Icons will auto-download in all required sizes
3. Place them in the `frontend/icons/` directory

### Deployment
```bash
# Production build
npm start

# Deploy to your preferred hosting platform
# (Vercel, Netlify, Railway, etc.)
```

## 🐛 Troubleshooting

### Camera Issues
- **Permission denied**: Grant camera access in browser settings
- **No camera detected**: Ensure device has a camera
- **Poor lighting**: Use in well-lit conditions for better detection

### Model Loading
- **Slow initial load**: TensorFlow.js models load on first use
- **Detection failures**: Ensure dog is clearly visible in frame
- **False positives**: Model may detect other animals as dogs

### API Errors
- **Authentication failed**: Check OpenAI API key
- **Rate limiting**: Reduce scan frequency
- **Network errors**: Check internet connection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o vision capabilities
- **TensorFlow.js** team for client-side ML
- **TailwindCSS** for the utility-first CSS framework
- **Dog owners everywhere** for inspiring this project! 🐕❤️

---

**Made with ❤️ for dog lovers everywhere**

*PupCam Mood Reader - Understanding your furry friend, one scan at a time!* 
## 🚀 Vercel Deployment

This app is now configured for Vercel! See `deploy-vercel.md` for detailed instructions.

### Quick Deploy:
1. Go to [vercel.com](https://vercel.com)
2. Import this GitHub repository  
3. Add environment variable: `OPENAI_API_KEY`
4. Deploy!

Your app will be available at: `https://your-app.vercel.app`

### What's Included:
- ✅ Serverless API functions
- ✅ Static frontend hosting  
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ PWA support

