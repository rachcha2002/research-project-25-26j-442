import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

class Database:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    def connect_db(cls):
        # Fetches from your .env file
        mongo_url = os.getenv("MONGO_URI") 
        cls.client = AsyncIOMotorClient(mongo_url)
        
        # Name of your specific database
        cls.db = cls.client.get_database("pediatric_nutrition")
        print("✅ Successfully connected to MongoDB.")

    @classmethod
    def close_db(cls):
        if cls.client:
            cls.client.close()
            print("🔌 MongoDB connection closed.")

    @classmethod
    def get_collection(cls, name: str):
        """Helper to get a collection quickly"""
        return cls.db[name]

    @classmethod
    async def ensure_collection(cls, name: str):
        existing_collections = await cls.db.list_collection_names()
        if name not in existing_collections:
            await cls.db.create_collection(name)
