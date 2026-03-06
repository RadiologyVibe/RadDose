import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="RadDose - Radiation Dose Educator")

static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def root():
    return FileResponse(os.path.join(static_dir, "index.html"))

def run():
    uvicorn.run("raddose.main:app", host="0.0.0.0", port=8700, reload=True)

if __name__ == "__main__":
    run()
