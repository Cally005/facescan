import * as faceapi from "face-api.js";
import React from "react";
import "./App.css";
import FaceAnalyzer from "./components/ImageUpload";

function App() {
  const detectFaces = async (imageFile) => {
    // Load face-api.js models
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    await faceapi.nets.faceExpressionNet.loadFromUri("/models");

    // Detect faces in the image
    const img = await faceapi.bufferToImage(imageFile);
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withFaceExpressions();
    console.log(detections);
  };

  return (
    <div className="App">
      <h1>Face Scanning and Analysis</h1>
      <FaceAnalyzer onImageUpload={detectFaces} />
    </div>
  );
}

export default App;
