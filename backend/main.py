from fastapi import FastAPI

app = FastAPI(title="SFC Tracker API")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "SFC Tracker API funcionando"
    }