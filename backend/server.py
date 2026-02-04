from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Admin code for analytics access
ADMIN_CODE = "890890"


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class AnalyticsEvent(BaseModel):
    event_type: str  # 'visit' or 'cta_click'
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime('%Y-%m-%d'))

class AdminAuth(BaseModel):
    code: str

class DailyStats(BaseModel):
    date: str
    visits: int
    cta_clicks: int

class AnalyticsResponse(BaseModel):
    total_visits: int
    total_cta_clicks: int
    daily_stats: List[DailyStats]


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# Analytics endpoints
@api_router.post("/analytics/visit")
async def record_visit():
    """Record a page visit"""
    event = AnalyticsEvent(event_type='visit')
    doc = {
        'event_type': event.event_type,
        'timestamp': event.timestamp.isoformat(),
        'date': event.date
    }
    await db.analytics.insert_one(doc)
    return {"status": "ok"}

@api_router.post("/analytics/cta-click")
async def record_cta_click():
    """Record a CTA button click"""
    event = AnalyticsEvent(event_type='cta_click')
    doc = {
        'event_type': event.event_type,
        'timestamp': event.timestamp.isoformat(),
        'date': event.date
    }
    await db.analytics.insert_one(doc)
    return {"status": "ok"}

@api_router.post("/analytics/data", response_model=AnalyticsResponse)
async def get_analytics(auth: AdminAuth):
    """Get analytics data (requires admin code)"""
    if auth.code != ADMIN_CODE:
        raise HTTPException(status_code=401, detail="Invalid admin code")
    
    # Get total counts
    total_visits = await db.analytics.count_documents({'event_type': 'visit'})
    total_cta_clicks = await db.analytics.count_documents({'event_type': 'cta_click'})
    
    # Get daily stats for last 30 days
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).strftime('%Y-%m-%d')
    
    # Aggregate visits by date
    visit_pipeline = [
        {'$match': {'event_type': 'visit', 'date': {'$gte': thirty_days_ago}}},
        {'$group': {'_id': '$date', 'count': {'$sum': 1}}},
        {'$sort': {'_id': 1}}
    ]
    visit_stats = await db.analytics.aggregate(visit_pipeline).to_list(100)
    
    # Aggregate CTA clicks by date
    click_pipeline = [
        {'$match': {'event_type': 'cta_click', 'date': {'$gte': thirty_days_ago}}},
        {'$group': {'_id': '$date', 'count': {'$sum': 1}}},
        {'$sort': {'_id': 1}}
    ]
    click_stats = await db.analytics.aggregate(click_pipeline).to_list(100)
    
    # Combine into daily stats
    visit_map = {v['_id']: v['count'] for v in visit_stats}
    click_map = {c['_id']: c['count'] for c in click_stats}
    
    all_dates = sorted(set(visit_map.keys()) | set(click_map.keys()))
    
    daily_stats = [
        DailyStats(
            date=date,
            visits=visit_map.get(date, 0),
            cta_clicks=click_map.get(date, 0)
        )
        for date in all_dates
    ]
    
    return AnalyticsResponse(
        total_visits=total_visits,
        total_cta_clicks=total_cta_clicks,
        daily_stats=daily_stats
    )

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