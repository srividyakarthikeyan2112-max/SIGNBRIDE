from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="SignBridge API", description="AI-powered sign language translator")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class HandLandmark(BaseModel):
    x: float
    y: float
    z: float

class SignPredictionRequest(BaseModel):
    landmarks: List[List[float]]  # 21 landmarks, each with [x, y, z]
    handedness: Optional[str] = "Right"

class SignPredictionResponse(BaseModel):
    gesture: str
    confidence: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TextToSignRequest(BaseModel):
    text: str

class TextToSignResponse(BaseModel):
    animation_key: str
    text: str
    supported: bool

class ConversationEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    message: str
    type: str  # "sign_to_text" or "text_to_sign"
    confidence: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Sign language gesture recognition using rule-based approach
class GestureClassifier:
    def __init__(self):
        # Define basic gesture patterns based on hand landmarks
        self.gestures = {
            "hello": self._check_hello,
            "thank_you": self._check_thank_you,
            "yes": self._check_yes,
            "no": self._check_no,
            "help": self._check_help,
            "stop": self._check_stop,
            "please": self._check_please,
            "water": self._check_water,
            "more": self._check_more,
            "finished": self._check_finished
        }
    
    def predict(self, landmarks):
        """Predict gesture based on hand landmarks"""
        if not landmarks or len(landmarks) < 21:
            return "unknown", 0.1
        
        best_gesture = "unknown"
        best_confidence = 0.1
        
        for gesture_name, check_func in self.gestures.items():
            confidence = check_func(landmarks)
            if confidence > best_confidence:
                best_gesture = gesture_name
                best_confidence = confidence
        
        return best_gesture, min(best_confidence, 0.95)  # Cap confidence at 95%
    
    def _get_finger_extended(self, landmarks):
        """Check which fingers are extended based on landmarks"""
        # Landmark indices for fingertips and joints
        tip_ids = [4, 8, 12, 16, 20]  # thumb, index, middle, ring, pinky tips
        pip_ids = [3, 6, 10, 14, 18]  # corresponding joints
        
        extended = []
        for i, (tip_id, pip_id) in enumerate(zip(tip_ids, pip_ids)):
            if i == 0:  # Thumb
                extended.append(landmarks[tip_id][0] > landmarks[pip_id][0])
            else:  # Other fingers
                extended.append(landmarks[tip_id][1] < landmarks[pip_id][1])
        
        return extended
    
    def _check_hello(self, landmarks):
        """Check for hello gesture - open hand waving"""
        extended = self._get_finger_extended(landmarks)
        # All fingers extended
        if sum(extended) >= 4:
            return 0.8
        return 0.2
    
    def _check_thank_you(self, landmarks):
        """Check for thank you gesture - hand near chin/mouth"""
        # Check if hand is near face area (higher Y coordinate)
        palm_y = landmarks[0][1]  # Wrist Y coordinate
        if palm_y < 0.3:  # Hand is in upper part of frame
            return 0.7
        return 0.2
    
    def _check_yes(self, landmarks):
        """Check for yes gesture - nodding motion or thumbs up"""
        extended = self._get_finger_extended(landmarks)
        # Thumb up, other fingers down
        if extended[0] and not any(extended[1:]):
            return 0.8
        return 0.2
    
    def _check_no(self, landmarks):
        """Check for no gesture - index finger wagging"""
        extended = self._get_finger_extended(landmarks)
        # Only index finger extended
        if not extended[0] and extended[1] and not any(extended[2:]):
            return 0.7
        return 0.2
    
    def _check_help(self, landmarks):
        """Check for help gesture - open palm facing forward"""
        extended = self._get_finger_extended(landmarks)
        palm_z = landmarks[0][2]  # Wrist Z coordinate
        if sum(extended) >= 3 and palm_z < 0:  # Palm facing forward
            return 0.6
        return 0.2
    
    def _check_stop(self, landmarks):
        """Check for stop gesture - flat hand, palm out"""
        extended = self._get_finger_extended(landmarks)
        # All fingers except thumb extended, palm out
        if sum(extended[1:]) >= 3:
            return 0.7
        return 0.2
    
    def _check_please(self, landmarks):
        """Check for please gesture - flat hand on chest"""
        extended = self._get_finger_extended(landmarks)
        palm_y = landmarks[0][1]
        # Flat hand in middle area
        if sum(extended) >= 3 and 0.3 < palm_y < 0.7:
            return 0.6
        return 0.2
    
    def _check_water(self, landmarks):
        """Check for water gesture - cupped hand near mouth"""
        extended = self._get_finger_extended(landmarks)
        palm_y = landmarks[0][1]
        # Curved hand near mouth area
        if sum(extended) <= 2 and palm_y < 0.4:
            return 0.6
        return 0.2
    
    def _check_more(self, landmarks):
        """Check for more gesture - fingertips touching"""
        # Check if fingertips are close together
        fingertips = [landmarks[i] for i in [4, 8, 12, 16, 20]]
        center_x = sum(tip[0] for tip in fingertips) / 5
        center_y = sum(tip[1] for tip in fingertips) / 5
        
        # Check if all fingertips are close to center
        distances = [((tip[0] - center_x)**2 + (tip[1] - center_y)**2)**0.5 for tip in fingertips]
        if all(d < 0.1 for d in distances):
            return 0.7
        return 0.2
    
    def _check_finished(self, landmarks):
        """Check for finished gesture - hands apart/done"""
        extended = self._get_finger_extended(landmarks)
        # Open hand with moderate confidence
        if sum(extended) >= 3:
            return 0.5
        return 0.2


# Initialize gesture classifier
gesture_classifier = GestureClassifier()

# Text to sign animation mapping
SIGN_ANIMATIONS = {
    "hello": "wave_hello.gif",
    "thank you": "thank_you.gif", 
    "yes": "thumbs_up.gif",
    "no": "shake_no.gif",
    "help": "help_gesture.gif",
    "stop": "stop_hand.gif",
    "please": "please_gesture.gif",
    "water": "water_drink.gif",
    "more": "more_gesture.gif",
    "finished": "finished_gesture.gif",
    "good morning": "good_morning.gif",
    "how are you": "how_are_you.gif",
    "i am fine": "i_am_fine.gif",
    "nice to meet you": "nice_to_meet.gif"
}


# API Routes
@api_router.get("/")
async def root():
    return {"message": "SignBridge API - AI-powered Sign Language Translator", "version": "1.0.0"}

@api_router.post("/predict", response_model=SignPredictionResponse)
async def predict_sign(request: SignPredictionRequest):
    """Predict sign language gesture from hand landmarks"""
    try:
        if not request.landmarks:
            raise HTTPException(status_code=400, detail="No landmarks provided")
        
        # Predict gesture using rule-based classifier
        gesture, confidence = gesture_classifier.predict(request.landmarks)
        
        # Store conversation entry
        entry = ConversationEntry(
            message=gesture,
            type="sign_to_text",
            confidence=confidence
        )
        await db.conversations.insert_one(entry.dict())
        
        return SignPredictionResponse(
            gesture=gesture,
            confidence=confidence
        )
        
    except Exception as e:
        logger.error(f"Error predicting sign: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing sign prediction")

@api_router.post("/text-to-sign", response_model=TextToSignResponse)
async def text_to_sign(request: TextToSignRequest):
    """Convert text to sign language animation"""
    try:
        text_lower = request.text.lower().strip()
        
        # Check if we have animation for this text
        animation_key = SIGN_ANIMATIONS.get(text_lower)
        supported = animation_key is not None
        
        if not supported:
            # Try to find partial matches for common phrases
            for phrase, key in SIGN_ANIMATIONS.items():
                if phrase in text_lower or text_lower in phrase:
                    animation_key = key
                    supported = True
                    break
        
        if not animation_key:
            animation_key = "not_supported.gif"
        
        # Store conversation entry
        entry = ConversationEntry(
            message=request.text,
            type="text_to_sign",
            confidence=0.9 if supported else 0.1
        )
        await db.conversations.insert_one(entry.dict())
        
        return TextToSignResponse(
            animation_key=animation_key,
            text=request.text,
            supported=supported
        )
        
    except Exception as e:
        logger.error(f"Error converting text to sign: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing text to sign conversion")

@api_router.get("/conversations", response_model=List[ConversationEntry])
async def get_conversations():
    """Get conversation history"""
    try:
        conversations = await db.conversations.find().sort("timestamp", -1).limit(50).to_list(50)
        return [ConversationEntry(**conv) for conv in conversations]
    except Exception as e:
        logger.error(f"Error fetching conversations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching conversation history")

@api_router.delete("/conversations")
async def clear_conversations():
    """Clear conversation history"""
    try:
        result = await db.conversations.delete_many({})
        return {"message": f"Cleared {result.deleted_count} conversation entries"}
    except Exception as e:
        logger.error(f"Error clearing conversations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error clearing conversations")

@api_router.get("/supported-signs")
async def get_supported_signs():
    """Get list of supported sign language gestures"""
    return {
        "signs": list(gesture_classifier.gestures.keys()),
        "phrases": list(SIGN_ANIMATIONS.keys()),
        "total_signs": len(gesture_classifier.gestures),
        "total_phrases": len(SIGN_ANIMATIONS)
    }

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "SignBridge API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "features": {
            "sign_recognition": True,
            "text_to_sign": True,
            "conversation_history": True
        }
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()