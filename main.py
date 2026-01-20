if __name__ == "__main__":
    import uvicorn
    import os
    
    # Ensure directories exist
    os.makedirs("Data/door_access", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    # Run the application
    uvicorn.run("src.app.main:app", host="0.0.0.0", port=8000, reload=True)
