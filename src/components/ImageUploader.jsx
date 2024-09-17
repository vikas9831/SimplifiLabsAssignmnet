

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ImageUploader = () => {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [readable, setReadable] = useState(false); 
  const [fileStatus, setFileStatus] = useState(""); 
  const navigate = useNavigate();

  // Validate file type and size
  const validateFile = (file) => {
    const fileSize = file.size / 1024 / 1024;
    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setError("Only .jpg and .png formats are allowed.");
      return false;
    }
    if (fileSize > 1) {
      setError("File size exceeds 1MB.");
      return false;
    }
    return true;
  };

  // Handle file change and perform automatic readable check
  const handleFileChange = (file) => {
    if (validateFile(file)) {
      const previewUrl = URL.createObjectURL(file);
      setImage({ file, preview: previewUrl });
      setError("");
      checkFileReadable(file);
    }
  };

  // Check if the file is readable using FileReader
  const checkFileReadable = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setReadable(true);
      setFileStatus("✅ File is readable and ready to upload.");
      setError("");
    };
    reader.onerror = () => {
      setReadable(false);
      setFileStatus("❌ File is not readable. Please choose a different file.");
      setError("File is not readable.");
    };
    reader.readAsDataURL(file);
  };

  // Handle image upload
  const handleImageUpload = useCallback(async () => {
    if (!image) {
      setError("Please select an image.");
      return;
    }
    if (!readable) {
      setError("File is not readable. Please select a different file.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", image.file);
    formData.append("upload_preset", "react_preset");

    try {
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dxciq1y9t/image/upload",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          },
        }
      );

      navigate("/image-details", { state: { uploadedImage: response.data } });
    } catch {
      setError("Failed to upload. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [image, navigate, readable]);

  useEffect(() => {
    return () => {
      if (image?.preview) URL.revokeObjectURL(image.preview);
    };
  }, [image]);

  const handleDrag = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files[0]) handleFileChange(event.dataTransfer.files[0]);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full p-6 mt-20">
      {uploading ? (
        <div className="flex flex-col items-center">
          <div className="relative w-20 h-20">
            <svg className="animate-spin text-blue-600" viewBox="0 0 36 36" width="100" height="100">
              <circle className="text-gray-300" stroke="currentColor" strokeWidth="4" fill="none" cx="18" cy="18" r="16" />
              <circle className="text-blue-600" stroke="currentColor" strokeWidth="4" fill="none" cx="18" cy="18" r="16" strokeDasharray="100" strokeDashoffset={100 - uploadProgress} />
            </svg>
            <div className="absolute top-0 left-0  ml-2 w-full h-full flex items-center justify-center">
              <p className="text-lg font-bold">{uploadProgress}%</p>
            </div>
          </div>
          <p className="text-gray-600 mt-4 ml-5">Uploading...</p>
        </div>
      ) : (
        <>
          <div
            className="w-full p-6 bg-slate-100 rounded-xl shadow-lg flex flex-col items-center justify-center border-4 border-dashed border-orange-300 hover:border-orange-500 transition-all"
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.querySelector("#fileInput").click()}
            style={{ height: "300px" }}
          >
            <input
              id="fileInput"
              type="file"
              onChange={(e) => handleFileChange(e.target.files[0])}
              className="hidden"
            />
            <p className="text-gray-600 text-center text-xl font-serif">Drag & Drop Image here OR Click to select images (Max size: 1MB)</p>
            {error && <p className="text-red-500 mt-4 font-bold text-center text-xl">{error}</p>}
          </div>

          {image?.preview && (
            <div className="w-full mt-8 flex flex-col items-center">
              <h3 className="text-xl font-mono font-extrabold mb-4 mt-10">Preview Image Before Uploading!</h3>
              <img src={image.preview} alt="Preview" className="w-full max-w-lg h-auto object-cover border-4 border-gray-300 rounded-lg" style={{ maxHeight: "500px" }} />
              <button
                className="mt-4 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
                onClick={() => setImage(null)}
              >Reset Image
              </button>
            </div>
          )}

          {fileStatus && (
            <p className={`text-lg mt-4 font-semibold ${readable ? "text-green-600" : "text-red-600"}`}>
              {fileStatus}
            </p>
          )}

          {readable && (
            <button
              onClick={handleImageUpload}
              disabled={!image}
              className="mt-4 px-6 py-2 font-semibold text-white bg-blue-700 rounded-lg hover:bg-purple-600 transition-colors"
            >
              Upload Image
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default ImageUploader;
