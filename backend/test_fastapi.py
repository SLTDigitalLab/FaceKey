from fastapi import FastAPI, Request
import uvicorn

app = FastAPI()

@app.post("/test")
async def test(request: Request):
    print(request.headers)
    body = await request.body()
    print("Body length:", len(body))
    print(body[:200])
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8101)
