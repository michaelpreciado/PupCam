class PupCamApp {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.model = null;
        this.isScanning = false;
        this.lastMoodResult = null;
        
        // Detection smoothing
        this.lastDetection = null;
        this.detectionStability = 0;
        this.detectionHistory = [];
        this.maxHistoryLength = 8;
        this.smoothedBbox = null;
        
        // Mood emoji mapping
        // Learning system
        this.sessionId = this.generateSessionId();
        this.lastAnalyzedImage = null;
        this.learningEnabled = true;
        this.moodEmojis = {
            happy: '😊',
            relaxed: '😌',
            anxious: '😟',
            fearful: '😨',
            angry: '😡',
            confused: '😕'
        };
        
        this.init();
    }
    
    async init() {
        console.log('🐕 Initializing PupCam Mood Reader...');
        
        // Get DOM elements
        this.video = document.getElementById('cameraVideo');
        this.canvas = document.getElementById('detectionCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Register service worker
        await this.registerServiceWorker();
        
        console.log('✅ PupCam initialized successfully');
    }
    
    setupEventListeners() {
        // Start camera button
        document.getElementById('startButton').addEventListener('click', async () => {
            await this.requestCameraPermission();
        });
        
        // Scan button
        document.getElementById('scanButton').addEventListener('click', async () => {
            if (!this.isScanning) {
                await this.scanForDog();
            }
        });
        
        // Share button
        document.getElementById('shareButton').addEventListener('click', () => {
            this.shareResult();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    async requestCameraPermission() {
        try {
            this.showElement('loadingOverlay');
            
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            this.video.srcObject = stream;
            
            // Wait for video to load
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.resizeCanvas();
                    resolve();
                };
            });
            
            // Load TensorFlow model
            await this.loadModel();
            
            // Hide permission prompt and show camera
            this.hideElement('permissionPrompt');
            this.hideElement('loadingOverlay');
            
        } catch (error) {
            console.error('Camera permission denied:', error);
            this.showError('Camera access required to scan dog moods');
            this.hideElement('loadingOverlay');
        }
    }
    
    async loadModel() {
        try {
            console.log('📦 Loading TensorFlow.js model...');
            // Using COCO-SSD for general object detection (includes people, dogs, cats, etc.)
            this.model = await cocoSsd.load();
            console.log('✅ Model loaded successfully');
            
            // Start continuous detection for face tracking
            this.startContinuousDetection();
        } catch (error) {
            console.error('Failed to load model:', error);
            this.showError('Failed to load detection model');
        }
    }
    
    resizeCanvas() {
        if (this.video && this.canvas) {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
        }
    }
    
    startContinuousDetection() {
        if (!this.model || !this.video) return;
        
        let lastDetectionTime = 0;
        const detectionInterval = 150; // Detect every 150ms instead of every frame
        
        const detectFaces = async (timestamp) => {
            try {
                if (this.video.readyState === 4 && timestamp - lastDetectionTime > detectionInterval) {
                    const predictions = await this.model.detect(this.video);
                    
                    // Find the best face detection (highest confidence)
                    const faceDetections = predictions.filter(prediction => 
                        (prediction.class === 'person' || 
                         prediction.class === 'dog' || 
                         prediction.class === 'cat') && 
                        prediction.score > 0.25 // Slightly lower threshold for stability
                    );
                    
                    let smoothedDetection = null;
                    
                    if (faceDetections.length > 0) {
                        // Sort by confidence and take the best one
                        const bestDetection = faceDetections.sort((a, b) => b.score - a.score)[0];
                        smoothedDetection = this.smoothDetection(bestDetection);
                    } else {
                        // No detection found, reduce stability
                        this.detectionStability = Math.max(0, this.detectionStability - 2);
                        if (this.detectionStability > 0 && this.lastDetection) {
                            smoothedDetection = this.lastDetection;
                        }
                    }
                    
                    // Clear and draw
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    if (smoothedDetection && this.detectionStability > 5) {
                        this.drawFaceBox(smoothedDetection);
                    }
                    
                    lastDetectionTime = timestamp;
                }
            } catch (error) {
                console.log('Detection error:', error);
            }
            
            // Continue detection loop (pause during scanning)
            if (!this.isScanning) {
                requestAnimationFrame(detectFaces);
            } else {
                // Resume detection after scanning
                setTimeout(() => {
                    if (!this.isScanning) {
                        requestAnimationFrame(detectFaces);
                    }
                }, 100);
            }
        };
        
        requestAnimationFrame(detectFaces);
    }
    
    smoothDetection(detection) {
        // Add to detection history
        this.detectionHistory.push(detection);
        if (this.detectionHistory.length > this.maxHistoryLength) {
            this.detectionHistory.shift();
        }
        
        // Check if detection is similar to previous ones
        if (this.lastDetection) {
            const [lastX, lastY, lastW, lastH] = this.lastDetection.bbox;
            const [newX, newY, newW, newH] = detection.bbox;
            
            // Calculate distance between detections
            const centerLastX = lastX + lastW / 2;
            const centerLastY = lastY + lastH / 2;
            const centerNewX = newX + newW / 2;
            const centerNewY = newY + newH / 2;
            
            const distance = Math.sqrt(
                Math.pow(centerNewX - centerLastX, 2) + 
                Math.pow(centerNewY - centerLastY, 2)
            );
            
            // If detection is close to previous one, increase stability
            if (distance < 60 && detection.class === this.lastDetection.class) {
                this.detectionStability = Math.min(15, this.detectionStability + 2);
                
                // Enhanced smoothing with multiple factors
                const smoothingFactor = Math.min(0.85, 0.6 + (this.detectionStability * 0.02));
                
                detection.bbox = [
                    lastX * smoothingFactor + newX * (1 - smoothingFactor),
                    lastY * smoothingFactor + newY * (1 - smoothingFactor),
                    lastW * smoothingFactor + newW * (1 - smoothingFactor),
                    lastH * smoothingFactor + newH * (1 - smoothingFactor)
                ];
            } else {
                // Detection jumped, reduce stability more gradually
                this.detectionStability = Math.max(0, this.detectionStability - 0.5);
            }
        } else {
            // First detection
            this.detectionStability = 7;
        }
        
        this.lastDetection = detection;
        return detection;
    }
    
    async scanForDog() {
        if (this.isScanning || !this.model) return;
        
        this.isScanning = true;
        
        try {
            // Show scanning UI
            this.showScanningState();
            
            // Detect objects in the video
            const predictions = await this.model.detect(this.video);
            
            // Look for faces (people, dogs, cats, etc.) in predictions
            const faceDetection = predictions.find(prediction => 
                (prediction.class === 'person' || 
                 prediction.class === 'dog' || 
                 prediction.class === 'cat') && 
                prediction.score > 0.3
            );
            
            if (faceDetection) {
                // Draw detection box
                this.drawDetectionBox(faceDetection);
                
                // Vibrate device
                this.vibrate(40);
                
                // Only analyze mood if it's a dog
                if (faceDetection.class === 'dog') {
                    const croppedImage = this.cropDogFace(faceDetection);
                    await this.analyzeMood(croppedImage);
                } else {
                    // Just show detection for other faces
                    console.log(`Detected ${faceDetection.class} face`);
                }
                
            } else {
                this.showError('No face detected in frame');
            }
            
        } catch (error) {
            console.error('Scan error:', error);
            this.showError('Failed to scan for dog');
        } finally {
            this.hideScanningState();
            this.isScanning = false;
            
            // Resume continuous detection
            setTimeout(() => {
                this.startContinuousDetection();
            }, 100);
        }
    }
    
    drawFaceBox(detection) {
        const [x, y, width, height] = detection.bbox;
        
        // Calculate face-focused bounding box
        let faceX, faceY, faceWidth, faceHeight;
        
        if (detection.class === 'person') {
            // For humans, focus on upper portion (head/face area)
            faceWidth = width * 0.7;  // 70% of detected width
            faceHeight = height * 0.4; // 40% of detected height (upper portion)
            faceX = x + (width - faceWidth) / 2; // Center horizontally
            faceY = y + height * 0.1; // Start 10% down from top
        } else {
            // For dogs/cats, focus on head area
            faceWidth = width * 0.6;  // 60% of detected width
            faceHeight = height * 0.5; // 50% of detected height
            faceX = x + (width - faceWidth) / 2; // Center horizontally
            faceY = y + height * 0.15; // Start 15% down from top
        }
        
        // Draw green face detection box (continuous)
        this.ctx.strokeStyle = '#10b981';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(faceX, faceY, faceWidth, faceHeight);
        
        // Draw enhanced label with better readability
        const label = detection.class === 'person' ? 'Face' : detection.class.charAt(0).toUpperCase() + detection.class.slice(1);
        const confidence = Math.round(detection.score * 100);
        const labelText = `${label} ${confidence}%`;
        
        // Measure text to size background properly
        this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif';
        const textMetrics = this.ctx.measureText(labelText);
        const labelWidth = textMetrics.width + 16;
        const labelHeight = 28;
        
        // Draw label background with rounded corners and shadow
        const labelX = faceX + (faceWidth - labelWidth) / 2; // Center the label
        const labelY = faceY - 35;
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(labelX + 2, labelY + 2, labelWidth, labelHeight);
        
        // Background with rounded corners effect
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
        
        // Border for definition
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
        
        // Text
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(labelText, labelX + labelWidth / 2, labelY + labelHeight / 2);
        
        // Reset text alignment
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'alphabetic';
    }
    
    drawDetectionBox(detection) {
        const [x, y, width, height] = detection.bbox;
        
        // Clear previous drawings
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw prominent green detection box for scan results
        this.ctx.strokeStyle = '#10b981';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(x, y, width, height);
        
        // Draw label
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(x, y - 30, width, 30);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        const label = detection.class === 'person' ? 'Face' : detection.class.charAt(0).toUpperCase() + detection.class.slice(1);
        this.ctx.fillText(`${label} (${Math.round(detection.score * 100)}%)`, x + 5, y - 10);
        
        // Auto-clear after 3 seconds
        setTimeout(() => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }, 3000);
    }
    
    cropDogFace(detection) {
        const [x, y, width, height] = detection.bbox;
        
        // Create a temporary canvas for cropping
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        
        // Set crop dimensions (focus on upper part for face)
        const cropWidth = Math.min(width, 300);
        const cropHeight = Math.min(height * 0.6, 300); // Upper 60% for face
        
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;
        
        // Draw the cropped region
        cropCtx.drawImage(
            this.video,
            x, y, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );
        
        // Convert to base64
        return cropCanvas.toDataURL('image/jpeg', 0.8);
    }
    
    async analyzeMood(imageData) {
        try {
            this.showElement('loadingOverlay');
            
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageData, sessionId: this.sessionId })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            this.lastMoodResult = result;
            this.lastAnalyzedImage = imageData;
            
            // Show learning feedback prompt after 3 seconds
            if (this.learningEnabled) {
                setTimeout(() => {
                    this.showFeedbackPrompt(result);
                }, 3000);
            }            this.displayMoodResult(result);
            
        } catch (error) {
            console.error('Mood analysis error:', error);
            this.showError('Failed to analyze mood');
        } finally {
            this.hideElement('loadingOverlay');
        }
    }
    
    displayMoodResult(result) {
        const { mood, confidence } = result;
        
        // Update badge content
        document.getElementById('moodEmoji').textContent = this.moodEmojis[mood] || '🤔';
        document.getElementById('moodText').textContent = mood.charAt(0).toUpperCase() + mood.slice(1);
        document.getElementById('confidenceText').textContent = `(${confidence}%)`;
        
        // Show mood badge with flip animation
        const badge = document.getElementById('moodBadge');
        badge.style.opacity = '1';
        badge.style.transform = 'scale(1)';
        badge.classList.add('animate-flip-in');
        
        // Show share button
        this.showElement('shareContainer');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideElement('moodBadge');
            this.hideElement('shareContainer');
            badge.classList.remove('animate-flip-in');
        }, 5000);
    }
    
    shareResult() {
        if (!this.lastMoodResult) return;
        
        const { mood } = this.lastMoodResult;
        const shareText = `My dog is ${mood}! 🐕 ${this.moodEmojis[mood]}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'PupCam Mood Reader',
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.showTemporaryMessage('Copied to clipboard!');
            }).catch(() => {
                this.showError('Sharing not supported');
            });
        }
    }
    
    showScanningState() {
        // Show scan line animation
        const scanLine = document.getElementById('scanLine');
        scanLine.style.opacity = '1';
        scanLine.classList.add('animate-scan');
        
        // Show loading spinner on button
        document.getElementById('scanIcon').style.opacity = '0';
        document.getElementById('loadingSpinner').style.opacity = '1';
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            this.hideScanningState();
        }, 2000);
    }
    
    hideScanningState() {
        // Hide scan line
        const scanLine = document.getElementById('scanLine');
        scanLine.style.opacity = '0';
        scanLine.classList.remove('animate-scan');
        
        // Restore button icon
        document.getElementById('scanIcon').style.opacity = '1';
        document.getElementById('loadingSpinner').style.opacity = '0';
    }
    
    showError(message) {
        console.error('PupCam Error:', message);
        
        // Show error icon
        this.showElement('errorIcon');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideElement('errorIcon');
        }, 3000);
    }
    
    showTemporaryMessage(message) {
        // Create temporary message overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg z-50';
        overlay.textContent = message;
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 2000);
    }
    
    showElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.opacity = '1';
            element.style.transform = 'scale(1) translateY(0)';
            element.style.pointerEvents = 'auto';
        }
    }
    
    hideElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.opacity = '0';
            element.style.transform = 'scale(0) translateY(4px)';
            element.style.pointerEvents = 'none';
        }
    }
    
    vibrate(duration) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registered:', registration);
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PupCamApp();
}); 
    // Learning and feedback methods
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async sendFeedback(predictedMood, actualMood, confidence, notes = '') {
        try {
            const feedbackData = {
                sessionId: this.sessionId,
                predictedMood: predictedMood,
                actualMood: actualMood,
                confidence: confidence,
                imageHash: this.hashCode(this.lastAnalyzedImage || ''),
                notes: notes,
                timestamp: new Date().toISOString()
            };

            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });

            if (response.ok) {
                console.log('✅ Feedback sent for learning');
                this.showTemporaryMessage('Thanks! This helps PupCam learn 🧠');
            }
        } catch (error) {
            console.error('Failed to send feedback:', error);
        }
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    showFeedbackPrompt(result) {
        // Create feedback UI overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-4 max-w-sm shadow-xl">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Help PupCam Learn! 🧠</h3>
                <p class="text-gray-600 dark:text-gray-300 mb-4">
                    I detected: <strong>${result.mood} (${result.confidence}%)</strong><br>
                    Was this correct?
                </p>
                <div class="space-y-3">
                    <button id="feedback-correct" class="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                        ✅ Yes, that's correct!
                    </button>
                    <div class="grid grid-cols-2 gap-2">
                        ${Object.keys(this.moodEmojis).map(mood => 
                            mood !== result.mood ? 
                            `<button class="feedback-mood bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm" data-mood="${mood}">
                                ${this.moodEmojis[mood]} ${mood}
                            </button>` : ''
                        ).join('')}
                    </div>
                    <button id="feedback-skip" class="w-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors">
                        Skip
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Handle feedback responses
        document.getElementById('feedback-correct').addEventListener('click', () => {
            this.sendFeedback(result.mood, result.mood, result.confidence, 'User confirmed correct');
            document.body.removeChild(overlay);
        });

        document.getElementById('feedback-skip').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        document.querySelectorAll('.feedback-mood').forEach(button => {
            button.addEventListener('click', () => {
                const actualMood = button.dataset.mood;
                this.sendFeedback(result.mood, actualMood, result.confidence, 'User correction');
                document.body.removeChild(overlay);
            });
        });

        // Auto-close after 15 seconds
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 15000);
    }
