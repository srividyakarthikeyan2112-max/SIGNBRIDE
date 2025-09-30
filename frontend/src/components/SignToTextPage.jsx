import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { 
  Hand, 
  Camera, 
  CameraOff, 
  Volume2, 
  VolumeX,
  ArrowLeft,
  Play,
  Square,
  Mic,
  MicOff,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { Separator } from './ui/separator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SignToTextPage = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentGesture, setCurrentGesture] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [latency, setLatency] = useState(0);
  const [handsInstance, setHandsInstance] = useState(null);

  // Status indicators
  const [cameraStatus, setCameraStatus] = useState('inactive');
  const [modelStatus, setModelStatus] = useState('loading');

  useEffect(() => {
    loadMediaPipe();
    return () => {
      if (handsInstance) {
        handsInstance.close();
      }
    };
  }, []);

  const loadMediaPipe = async () => {
    try {
      // Simulate MediaPipe loading
      setModelStatus('loading');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock MediaPipe hands initialization
      const mockHands = {
        initialize: () => Promise.resolve(),
        onResults: (callback) => {
          // This would be the real MediaPipe callback
        },
        send: (imageData) => {
          // Mock hand detection results
          return new Promise(resolve => {
            setTimeout(() => {
              const mockLandmarks = generateMockLandmarks();
              resolve({
                multiHandLandmarks: [mockLandmarks],
                multiHandedness: [{label: 'Right'}]
              });
            }, 100);
          });
        },
        close: () => {}
      };

      setHandsInstance(mockHands);
      setModelStatus('ready');
      toast.success('Hand tracking model loaded successfully!');
    } catch (error) {
      console.error('Error loading MediaPipe:', error);
      setModelStatus('error');
      toast.error('Failed to load hand tracking model');
    }
  };

  const generateMockLandmarks = () => {
    // Generate 21 mock hand landmarks for demonstration
    const landmarks = [];
    for (let i = 0; i < 21; i++) {
      landmarks.push([
        Math.random() * 0.5 + 0.25, // x: 0.25-0.75
        Math.random() * 0.5 + 0.25, // y: 0.25-0.75
        Math.random() * 0.1 - 0.05  // z: -0.05-0.05
      ]);
    }
    return landmarks;
  };

  const startCamera = async () => {
    try {
      setCameraStatus('loading');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraEnabled(true);
          setCameraStatus('active');
          toast.success('Camera started successfully!');
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraStatus('error');
      toast.error('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraEnabled(false);
      setCameraStatus('inactive');
      setIsDetecting(false);
    }
  };

  const startDetection = async () => {
    if (!cameraEnabled || modelStatus !== 'ready') {
      toast.error('Please start camera and wait for model to load');
      return;
    }

    setIsDetecting(true);
    toast.success('Sign detection started!');

    // Start detection loop
    const detectLoop = async () => {
      if (!isDetecting) return;

      try {
        const startTime = performance.now();
        
        // Mock hand detection for demo
        const mockLandmarks = generateMockLandmarks();
        
        // Call backend API for prediction
        const response = await fetch(`${API}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            landmarks: mockLandmarks,
            handedness: 'Right'
          })
        });

        if (response.ok) {
          const result = await response.json();
          const endTime = performance.now();
          const detectionLatency = Math.round(endTime - startTime);
          
          setCurrentGesture(result.gesture);
          setConfidence(result.confidence);
          setLatency(detectionLatency);

          // Add to history if confidence is high enough
          if (result.confidence > 0.6) {
            const newEntry = {
              id: Date.now(),
              gesture: result.gesture,
              confidence: result.confidence,
              timestamp: new Date().toLocaleTimeString(),
              spoken: false
            };
            
            setDetectionHistory(prev => [newEntry, ...prev.slice(0, 9)]);
            
            // Auto-speak if enabled and gesture is recognized
            if (audioEnabled && result.gesture !== 'unknown') {
              speakText(result.gesture);
            }
          }
        }
      } catch (error) {
        console.error('Detection error:', error);
      }

      // Continue detection loop
      if (isDetecting) {
        setTimeout(detectLoop, 200); // 5 FPS detection
      }
    };

    detectLoop();
  };

  const stopDetection = () => {
    setIsDetecting(false);
    setCurrentGesture('');
    setConfidence(0);
    toast.info('Sign detection stopped');
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window && text && text !== 'unknown') {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
      
      // Update history to mark as spoken
      setDetectionHistory(prev => 
        prev.map(entry => 
          entry.gesture === text && !entry.spoken 
            ? { ...entry, spoken: true } 
            : entry
        )
      );
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    toast.info(audioEnabled ? 'Auto-speech disabled' : 'Auto-speech enabled');
  };

  const clearHistory = () => {
    setDetectionHistory([]);
    toast.info('Detection history cleared');
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 0.8) return 'bg-green-500';
    if (conf >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (conf) => {
    if (conf >= 0.8) return 'High';
    if (conf >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Hand className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg" style={{fontFamily: 'Space Grotesk'}}>SignBridge</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-white/50">
              Sign → Text
            </Badge>
          </div>
        </nav>
      </header>

      <div className="container mx-auto px-4 pb-8">
        {/* Status Bar */}
        <Card className="glass border-0 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className={`status-indicator ${cameraStatus === 'active' ? 'active' : 'inactive'}`} data-testid="camera-status">
                  <div className="status-dot"></div>
                  Camera: {cameraStatus === 'active' ? 'Active' : 'Inactive'}
                </div>
                
                <div className={`status-indicator ${modelStatus === 'ready' ? 'active' : 'inactive'}`} data-testid="model-status">
                  <div className="status-dot"></div>
                  Model: {modelStatus === 'ready' ? 'Ready' : modelStatus === 'loading' ? 'Loading...' : 'Error'}
                </div>
                
                {isDetecting && (
                  <div className="status-indicator active" data-testid="detection-status">
                    <Activity className="w-3 h-3" />
                    Detecting • {latency}ms
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 bg-white/50 px-3 py-1 rounded-full">
                🔒 Video processed locally • Not stored
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Camera Panel */}
          <Card className="glass border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{fontFamily: 'Space Grotesk'}}>
                <Camera className="w-5 h-5" />
                Camera Input
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-80 object-cover sign-video"
                  autoPlay
                  muted
                  playsInline
                  data-testid="camera-video"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-80"
                  style={{ display: 'none' }}
                />
                
                {!cameraEnabled && (
                  <div className="absolute inset-0 bg-gray-900 rounded-xl flex items-center justify-center">
                    <div className="text-center text-white">
                      <CameraOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Camera is off</p>
                      <p className="text-sm opacity-75">Click "Start Camera" to begin</p>
                    </div>
                  </div>
                )}
                
                {/* Controls Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2">
                  {!cameraEnabled ? (
                    <Button onClick={startCamera} className="btn-primary text-white" data-testid="start-camera-btn">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={isDetecting ? stopDetection : startDetection}
                        className={isDetecting ? "bg-red-500 hover:bg-red-600 text-white" : "btn-primary text-white"}
                        disabled={modelStatus !== 'ready'}
                        data-testid="detection-toggle-btn"
                      >
                        {isDetecting ? (
                          <>
                            <Square className="w-4 h-4 mr-2" />
                            Stop Detection
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Start Detection
                          </>
                        )}
                      </Button>
                      
                      <Button onClick={stopCamera} variant="outline" className="bg-white/80" data-testid="stop-camera-btn">
                        <CameraOff className="w-4 h-4 mr-2" />
                        Stop Camera
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detection Panel */}
          <Card className="glass border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2" style={{fontFamily: 'Space Grotesk'}}>
                  <Hand className="w-5 h-5" />
                  Detection Results
                </CardTitle>
                <Button
                  onClick={toggleAudio}
                  variant="outline"
                  size="sm"
                  className="bg-white/80"
                  data-testid="audio-toggle-btn"
                >
                  {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Current Detection */}
              <div className="mb-6">
                <div className="text-center p-6 bg-white/50 rounded-xl">
                  {currentGesture ? (
                    <>
                      <div className="text-3xl font-bold mb-2 capitalize" data-testid="current-gesture">
                        {currentGesture === 'unknown' ? '🤔 Try again' : `👋 ${currentGesture}`}
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <Badge className={`${getConfidenceColor(confidence)} text-white`} data-testid="confidence-badge">
                          {Math.round(confidence * 100)}% - {getConfidenceText(confidence)}
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getConfidenceColor(confidence)}`}
                          style={{width: `${confidence * 100}%`}}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500" data-testid="no-detection">
                      {isDetecting ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Watching for signs...
                        </div>
                      ) : (
                        <>
                          <Hand className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          Start detection to see results
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {currentGesture && currentGesture !== 'unknown' && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      onClick={() => speakText(currentGesture)}
                      className="btn-secondary text-white"
                      data-testid="speak-btn"
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      Speak Again
                    </Button>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Detection History */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Recent Detections</h4>
                  {detectionHistory.length > 0 && (
                    <Button onClick={clearHistory} variant="outline" size="sm" className="bg-white/80" data-testid="clear-history-btn">
                      Clear
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto" data-testid="detection-history">
                  {detectionHistory.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No detections yet
                    </div>
                  ) : (
                    detectionHistory.map((entry) => (
                      <div key={entry.id} className="chat-message sign-to-text rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{entry.gesture}</span>
                            {entry.spoken && <Volume2 className="w-3 h-3 text-blue-500" />}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Badge variant="outline" className="text-xs bg-white/50">
                              {Math.round(entry.confidence * 100)}%
                            </Badge>
                            <span>{entry.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Tips */}
        <Card className="glass border-0 mt-6">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Quick Tips for Better Detection
            </h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Keep your hand clearly visible in the camera frame</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Ensure good lighting for better hand tracking</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Hold gestures for 2-3 seconds for recognition</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignToTextPage;