import uvicorn

if __name__ == "__main__":
    print("================================================================")
    print(" Launching SIH25042 eDNA Backend Server...")
    print(" Interactive Swagger UI Docs available at: http://127.0.0.1:8000/docs")
    print("================================================================")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
