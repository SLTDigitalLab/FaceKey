if __name__ == "__main__":
    import uvicorn
    import os
    
    # Get the project root (parent of backend folder)
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(backend_dir)
    
    # Ensure directories exist in project root
    os.makedirs(os.path.join(project_root, "Data", "door_access"), exist_ok=True)
    os.makedirs(os.path.join(project_root, "logs"), exist_ok=True)
    
    # Run the application
    uvicorn.run("src.app.main:app", host="0.0.0.0", port=8000, reload=True)
