import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { 
  Hand, 
  MessageSquare, 
  ArrowLeft,
  Send,
  Mic,
  MicOff,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  User,
  Bot,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Separator } from './ui/separator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TextToSignPage = () => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [conversationLog, setConversationLog] = useState([]);
  const [recognition, setRecognition] = useState(null);
  const [supportedPhrases, setSupportedPhrases] = useState([]);

  // Common quick phrases
  const quickPhrases = [
    'Hello',
    'Thank you',
    'Yes',
    'No',
    'Help',
    'Stop',
    'Please',
    'Good morning',
    'How are you?',
    'I am fine',
    'Nice to meet you',
    'Water'
  ];

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        toast.info('Listening for speech...');
      };
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        toast.success(`Heard: "${transcript}"`);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Speech recognition failed');
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }

    // Load supported phrases
    loadSupportedPhrases();
  }, []);

  const loadSupportedPhrases = async () => {
    try {
      const response = await fetch(`${API}/supported-signs`);
      if (response.ok) {
        const data = await response.json();
        setSupportedPhrases(data.phrases || []);
      }
    } catch (error) {
      console.error('Error loading supported phrases:', error);
    }
  };

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  const convertTextToSign = async (text) => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    try {
      setIsAnimating(true);
      
      const response = await fetch(`${API}/text-to-sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add to conversation log
        const logEntry = {
          id: Date.now(),
          text: text,
          animationKey: result.animation_key,
          supported: result.supported,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setConversationLog(prev => [logEntry, ...prev.slice(0, 19)]);
        setCurrentAnimation(result);
        
        // Show animation for 3 seconds
        setTimeout(() => {
          setIsAnimating(false);
        }, 3000);
        
        if (result.supported) {
          toast.success(`Converted to sign: "${text}"`);
        } else {
          toast.warning(`"${text}" not yet supported. Showing placeholder.`);
        }
        
        setInputText(''); // Clear input after conversion
      } else {
        throw new Error('Failed to convert text to sign');
      }
    } catch (error) {
      console.error('Error converting text to sign:', error);
      toast.error('Failed to convert text to sign');
      setIsAnimating(false);
    }
  };

  const playQuickPhrase = (phrase) => {
    setInputText(phrase);
    convertTextToSign(phrase);
  };

  const replayAnimation = () => {
    if (currentAnimation) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 3000);
      toast.info('Replaying sign animation');
    }
  };

  const clearConversation = () => {
    setConversationLog([]);
    setCurrentAnimation(null);
    toast.info('Conversation cleared');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <Hand className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg" style={{fontFamily: 'Space Grotesk'}}>SignBridge</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-white/50">
              Text → Sign
            </Badge>
          </div>
        </nav>
      </header>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <Card className="glass border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{fontFamily: 'Space Grotesk'}}>
                <MessageSquare className="w-5 h-5" />
                Text Input
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Text Input */}
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message here..."
                    className="min-h-[100px] bg-white/80 resize-none"
                    data-testid="text-input"
                  />
                  
                  {/* Voice Input Button */}
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    {recognition && (
                      <Button
                        onClick={isListening ? stopListening : startListening}
                        variant="outline"
                        size="sm"
                        className={`${isListening ? 'bg-red-100 border-red-300' : 'bg-white/80'} hover:scale-105 transition-transform`}
                        data-testid="voice-input-btn"
                      >
                        {isListening ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => convertTextToSign(inputText)}
                      disabled={!inputText.trim() || isAnimating}
                      className="btn-secondary text-white hover:scale-105 transition-transform"
                      data-testid="convert-btn"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Character Count */}
                <div className="text-xs text-gray-500 text-right">
                  {inputText.length}/200 characters
                </div>
              </div>

              <Separator className="my-6" />

              {/* Quick Phrases */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Quick Phrases
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickPhrases.map((phrase) => (
                    <Button
                      key={phrase}
                      onClick={() => playQuickPhrase(phrase)}
                      variant="outline"
                      size="sm"
                      className="bg-white/80 justify-start hover:bg-white/100 transition-all hover:scale-105"
                      disabled={isAnimating}
                      data-testid={`quick-phrase-${phrase.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Play className="w-3 h-3 mr-2" />
                      {phrase}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avatar Panel */}
          <Card className="glass border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2" style={{fontFamily: 'Space Grotesk'}}>
                  <Hand className="w-5 h-5" />
                  Sign Animation
                </CardTitle>
                {currentAnimation && (
                  <Button
                    onClick={replayAnimation}
                    variant="outline"
                    size="sm"
                    className="bg-white/80"
                    data-testid="replay-btn"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Replay
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Avatar Display */}
              <div className="avatar-container mb-6" data-testid="avatar-container">
                {isAnimating && currentAnimation ? (
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4 animate-bounce">
                      {getSignEmoji(currentAnimation.animation_key)}
                    </div>
                    <div className="text-xl font-semibold mb-2">
                      {currentAnimation.text}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm opacity-75">
                      <Play className="w-4 h-4" />
                      Signing...
                    </div>
                    
                    {!currentAnimation.supported && (
                      <div className="mt-4 bg-yellow-500/20 backdrop-blur-sm rounded-lg p-2">
                        <div className="flex items-center gap-1 text-yellow-200 text-sm">
                          <AlertTriangle className="w-3 h-3" />
                          Phrase not yet supported
                        </div>
                      </div>
                    )}
                  </div>
                ) : currentAnimation ? (
                  <div className="text-center text-white">
                    <div className="text-4xl mb-4 opacity-50">
                      {getSignEmoji(currentAnimation.animation_key)}
                    </div>
                    <div className="text-lg opacity-75 mb-4">
                      Ready to replay: "{currentAnimation.text}"
                    </div>
                    <Button
                      onClick={replayAnimation}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                      data-testid="replay-animation-btn"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play Again
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <Hand className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">3D Avatar Ready</p>
                    <p className="text-sm opacity-75">Type a message and click convert to see sign animation</p>
                  </div>
                )}
              </div>

              {/* Animation Info */}
              {currentAnimation && (
                <div className="bg-white/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Last Conversion</span>
                    <Badge className={currentAnimation.supported ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}>
                      {currentAnimation.supported ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Supported
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Placeholder
                        </>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">"{currentAnimation.text}"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversation Log */}
        <Card className="glass border-0 mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{fontFamily: 'Space Grotesk'}}>
                <MessageSquare className="w-5 h-5" />
                Conversation Log
              </CardTitle>
              {conversationLog.length > 0 && (
                <Button onClick={clearConversation} variant="outline" size="sm" className="bg-white/80" data-testid="clear-log-btn">
                  Clear Log
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto" data-testid="conversation-log">
              {conversationLog.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm opacity-75">Start by typing a message above</p>
                </div>
              ) : (
                conversationLog.map((entry) => (
                  <div key={entry.id} className="chat-message text-to-sign rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">You</span>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Badge variant="outline" className={`text-xs ${entry.supported ? 'bg-green-50' : 'bg-yellow-50'}`}>
                              {entry.supported ? 'Supported' : 'Placeholder'}
                            </Badge>
                            <span>{entry.timestamp}</span>
                          </div>
                        </div>
                        <p className="text-gray-700">"{entry.text}"</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                          <Hand className="w-3 h-3" />
                          Converted to sign animation
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="glass border-0 mt-6">
          <CardContent className="p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Tips for Better Experience
            </h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Use simple, clear phrases for better sign translation</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Try the quick phrases - they're optimized for sign language</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Use voice input for hands-free text entry</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper function to get emoji for sign animations
const getSignEmoji = (animationKey) => {
  const emojiMap = {
    'wave_hello.gif': '👋',
    'thank_you.gif': '🙏',
    'thumbs_up.gif': '👍',
    'shake_no.gif': '👎',
    'help_gesture.gif': '🆘',
    'stop_hand.gif': '✋',
    'please_gesture.gif': '🤲',
    'water_drink.gif': '💧',
    'more_gesture.gif': '➕',
    'finished_gesture.gif': '✅',
    'good_morning.gif': '🌅',
    'how_are_you.gif': '❓',
    'i_am_fine.gif': '😊',
    'nice_to_meet.gif': '🤝',
    'not_supported.gif': '❓'
  };
  
  return emojiMap[animationKey] || '👋';
};

export default TextToSignPage;