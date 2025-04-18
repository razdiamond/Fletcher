from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import shutil
import os
import librosa
import numpy as np
from more_itertools import chunked
from scipy.io import wavfile
from tensorflow.keras.models import load_model

SAMPLE_RATE = 48000

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change "*" to specific origins for security
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Create a directory to save uploaded files (if not already present)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/health")
async def health():
    return {"status": "healthy"}

def load_audio(file_path, sr=SAMPLE_RATE):
    """
    Loads an audio file and returns the waveform and sample rate.
    """
    y, sr = librosa.load(file_path, sr=sr)

    return y, sr

def split_waveform_with_chunked(waveform, chunk_size=480000, pad=True):
    chunks = list(chunked(waveform, chunk_size))

    if pad and len(chunks[-1]) < chunk_size:
        # Pad the last chunk with zeros
        last_chunk = np.pad(chunks[-1], (0, chunk_size - len(chunks[-1])), mode='constant')
        chunks[-1] = last_chunk

    # Convert each chunk back to numpy array
    return [np.array(chunk, dtype=np.float32) for chunk in chunks]

def preprocess(file_location: str):
    x_noisy, _ = load_audio(file_location, sr=SAMPLE_RATE)
    chunks = np.stack(split_waveform_with_chunked(x_noisy))
    
    return chunks

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    
    # Save the uploaded file
    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # Preprocess
    chunks = preprocess(file_location)

    # Prediction
    model = load_model("model/denoiser_weights_full_data_regular_adam.h5", compile=False)
    prediction = model.predict(chunks)

    output_filepath = f'{UPLOAD_DIR}/{file_location.split("/")[-1][0:-4]} - clean.wav'
    wavfile.write(output_filepath, SAMPLE_RATE, prediction.flatten())
    
    return FileResponse(output_filepath)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
