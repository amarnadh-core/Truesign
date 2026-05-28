import os
# os.environ["TF_USE_LEGACY_KERAS"] = "1"
import uvicorn

if __name__ == "__main__":
    uvicorn.run("medium_gateway:app", host="0.0.0.0", port=8000)
