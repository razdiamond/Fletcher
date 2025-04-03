import { useState } from "react";
import titleImage from "../assets/images/Title.png";
import descriptionImage from "../assets/images/Description.png";

function Home() {
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [cleanAudioFile, setCleanAudioFile] = useState(null);
  const [cleanAudioUrl, setCleanAudioUrl] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file)); // Create a temporary URL for playback
    }
  };

  const handleUpload = async () => {
    if (!audioFile) {
      alert("Please upload an audio file first!");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        if (url) {
          setCleanAudioFile(blob);
          setCleanAudioUrl(url); // Create a temporary URL for playback
          alert("File uploaded successfully!");
        } else {
          alert("Didn't recieve clean file from the model...");
        }
      } else {
        alert("Failed to upload file.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred while uploading.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (!cleanAudioUrl) return;

    const link = document.createElement("a");
    link.href = cleanAudioUrl;
    link.download = cleanAudioFile?.name || "downloaded_audio.mp3";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col justify-start items-center min-h-screen bg-transparent p-4">
      <img src={titleImage} alt="Title" className="w-21 h-auto" />
      <img src={descriptionImage} alt="Description" className="w-auto h-12 mb-4" />

      {/* Audio Upload */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="file:bg-[#fafb63] file:text-black file:px-4 file:py-2 file:border-none file:rounded-lg file:cursor-pointer"
        />

        {/* Hidden Audio Player */}
        {audioUrl && (
          <audio id="audio-player" controls>
            <source src={audioUrl} type={audioFile.type} />
            Your browser does not support the audio element.
          </audio>
        )}
      </div>

      <div className="flex justify-center items-center gap-4 mt-4">
        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`mt-4 px-6 py-2 rounded-lg bg-[#fafb63] ${
            isUploading ? "cursor-not-allowed" : "hover:bg-[#eff11e]"
          } text-black`}>
          {isUploading ? "Uploading..." : "Upload file to model"}
        </button>

        {/* Hidden Audio Player */}
        {cleanAudioUrl && (
          <audio id="audio-player" controls>
            <source src={cleanAudioUrl} type={cleanAudioFile.type} />
            Your browser does not support the audio element.
          </audio>
        )}
      </div>

      <div className="flex justify-center items-center gap-4 mt-4">
        {/* Download Button */}
        {audioUrl && (
          <button
            onClick={handleDownload}
            className="mt-4 px-6 py-2 bg-[#fafb63] hover:bg-[#eff11e] text-black rounded-lg">
            Download Clean File
          </button>
        )}
      </div>
    </div>
  );
}

export default Home;
