import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Hand, 
  MessageSquare, 
  Users, 
  Zap,
  Camera,
  Volume2,
  ArrowRight,
  Sparkles,
  Heart,
  Globe
} from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Hand className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold" style={{fontFamily: 'Space Grotesk'}}>SignBridge</span>
          </div>
          <Badge variant="outline" className="bg-white/50 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 mr-1" />
            HACKTRIX'25
          </Badge>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
            <Globe className="w-3 h-3 mr-1" />
            AI-Powered Communication
          </Badge>
          
          <h1 className="text-6xl font-bold mb-6 leading-tight" style={{fontFamily: 'Space Grotesk'}}>
            <span className="gradient-text">Turning Silence</span>
            <br />
            <span>Into Conversations</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Breaking barriers between sign language users and the hearing world with real-time AI translation. 
            Empowering <strong>63+ million deaf/mute individuals in India</strong> with dignity and independence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/sign-to-text">
              <Button size="lg" className="btn-primary text-white px-8 py-6 text-lg font-semibold min-w-[200px]" data-testid="sign-to-text-btn">
                <Hand className="w-5 h-5 mr-2" />
                Sign → Text
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            
            <Link to="/text-to-sign">
              <Button size="lg" className="btn-secondary text-white px-8 py-6 text-lg font-semibold min-w-[200px]" data-testid="text-to-sign-btn">
                <MessageSquare className="w-5 h-5 mr-2" />
                Text → Sign
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="glass rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600">63M+</div>
              <div className="text-sm text-gray-600">Deaf/Mute in India</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-600">10+</div>
              <div className="text-sm text-gray-600">Supported Signs</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-2xl font-bold text-green-600">&lt;0.5s</div>
              <div className="text-sm text-gray-600">Real-time Detection</div>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="text-2xl font-bold text-orange-600">100%</div>
              <div className="text-sm text-gray-600">Privacy Protected</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{fontFamily: 'Space Grotesk'}}>
            Bridging Communication Gaps
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced AI technology that understands sign language and converts it to speech, and vice versa
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Sign to Text Feature */}
          <Card className="glass border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold" style={{fontFamily: 'Space Grotesk'}}>
                Sign Language Recognition
              </CardTitle>
              <CardDescription className="text-lg">
                Real-time detection and translation of Indian Sign Language
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  MediaPipe hand tracking technology
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Recognizes 10+ common ISL signs
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Instant text display and speech synthesis
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Confidence scoring for accuracy
                </li>
              </ul>
              <div className="mt-6">
                <Link to="/sign-to-text">
                  <Button className="w-full btn-primary text-white" data-testid="try-sign-recognition">
                    Try Sign Recognition
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Text to Sign Feature */}
          <Card className="glass border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Hand className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold" style={{fontFamily: 'Space Grotesk'}}>
                Text to Sign Animation
              </CardTitle>
              <CardDescription className="text-lg">
                Convert text and speech into animated sign language
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-green-500" />
                  3D avatar sign language animations
                </li>
                <li className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-green-500" />
                  Common phrases and responses
                </li>
                <li className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-green-500" />
                  Voice input with speech recognition
                </li>
                <li className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-green-500" />
                  Natural signing animations
                </li>
              </ul>
              <div className="mt-6">
                <Link to="/text-to-sign">
                  <Button className="w-full btn-secondary text-white" data-testid="try-text-to-sign">
                    Try Text to Sign
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Impact Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="glass rounded-2xl p-8 md:p-12 text-center">
          <Heart className="w-12 h-12 text-red-500 mx-auto mb-6" />
          <h3 className="text-3xl font-bold mb-4" style={{fontFamily: 'Space Grotesk'}}>
            Creating Inclusive Communities
          </h3>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            SignBridge empowers deaf and hard-of-hearing individuals with independence and dignity, 
            breaking down communication barriers in workplaces, hospitals, schools, and everyday life.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2 text-sm bg-white/50">
              <Users className="w-4 h-4 mr-2" />
              Healthcare Access
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm bg-white/50">
              <Users className="w-4 h-4 mr-2" />
              Employment Opportunities
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm bg-white/50">
              <Users className="w-4 h-4 mr-2" />
              Educational Support
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm bg-white/50">
              <Users className="w-4 h-4 mr-2" />
              Customer Service
            </Badge>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Hand className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg" style={{fontFamily: 'Space Grotesk'}}>SignBridge</span>
        </div>
        <p className="text-gray-600 mb-2">
          Built with ❤️ by Team StackOverflowers for HACKTRIX'25
        </p>
        <p className="text-sm text-gray-500">
          Empowering communication • Fostering inclusion • Creating opportunities
        </p>
      </footer>
    </div>
  );
};

export default HomePage;