import CircularProgress from "@mui/material/CircularProgress";
import * as faceapi from "face-api.js";
import React, { useRef, useState } from "react";
import Button from "@mui/material/Button";

const FaceAnalyzer = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [expression, setExpression] = useState("");
  const [landmarks, setLandmarks] = useState([]);
  const [mentalAbility, setMentalAbility] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const videoRef = useRef();

  const handleCameraCapture = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setCameraEnabled(true);
    } catch (error) {
      setErrorMessage("Error accessing camera. Please try again.");
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setLoading(true);
    setErrorMessage("");
    setCameraEnabled(false);

    // Load face-api.js models
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    await faceapi.nets.faceExpressionNet.loadFromUri("/models");

    // Detect faces in the image
    const img = await faceapi.bufferToImage(file);
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    // Display detected expression and facial landmarks
    if (detections && detections.length > 0) {
      const { expressions, landmarks } = detections[0];
      setExpression(getExpression(expressions));
      setLandmarks(landmarks);
      const ability = evaluateMentalAbility(expressions);
      setMentalAbility(ability);
    } else {
      setExpression("");
      setLandmarks([]);
      setMentalAbility(0);
      setErrorMessage("No face detected. Please upload another image.");
    }

    setLoading(false);
  };

  const getExpression = (expressions) => {
    const maxExpression = Object.keys(expressions).reduce((a, b) =>
      expressions[a] > expressions[b] ? a : b
    );
    switch (maxExpression) {
      case "angry":
        return "Angry";
      case "disgusted":
        return "Disgusted";
      case "fearful":
        return "Fearful";
      case "happy":
        return "Happy";
      case "neutral":
        return "Neutral";
      case "sad":
        return "Sad";
      case "surprised":
        return "Surprised";
      default:
        return "Unknown";
    }
  };

  const evaluateMentalAbility = (expressions) => {
    const totalExpression = Object.values(expressions).reduce(
      (acc, val) => acc + val,
      0
    );
    const mentalAbility = expressions["neutral"] / totalExpression;
    return mentalAbility;
  };

  const interpretMentalAbility = (ability) => {
    if (ability === 0) {
      return "No face detected";
    } else if (ability < 0.2) {
      return "Very low mental ability";
    } else if (ability < 0.4) {
      return "Low mental ability";
    } else if (ability < 0.6) {
      return "Average mental ability";
    } else if (ability < 0.8) {
      return "High mental ability";
    } else {
      return "Very high mental ability";
    }
  };

  const handleCaptureAndAnalyze = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      // Ensure videoRef.current exists before accessing its properties
      if (videoRef.current) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL();
        const blob = await (await fetch(dataUrl)).blob();
        setSelectedImage(blob);

        // Load face-api.js models
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");

        // Detect faces in the image
        const img = await faceapi.bufferToImage(blob);
        const detections = await faceapi
          .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        // Display detected expression and facial landmarks
        if (detections && detections.length > 0) {
          const { expressions, landmarks } = detections[0];
          setExpression(getExpression(expressions));
          setLandmarks(landmarks);
          const ability = evaluateMentalAbility(expressions);
          setMentalAbility(ability);
        } else {
          setExpression("");
          setLandmarks([]);
          setMentalAbility(0);
          setErrorMessage("No face detected. Please try again.");
        }
      } else {
        setErrorMessage("Video element is not initialized.");
      }
    } catch (error) {
      setErrorMessage("Error analyzing image. Please try again.");
    }

    setLoading(false);
    // Stop the video stream after analyzing
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
         <Button  color="info" size="medium" style={{background: 'green', color: 'white',  margin: 5, marginBottom: 20}} >

         <input type="file" accept="image/*" onChange={handleImageChange} />

         </Button>
      
      {cameraEnabled && (
        <Button color="info" size="medium" style={{background: 'green', color: 'white', margin: 5, marginBottom: 20}}  onClick={handleCaptureAndAnalyze}>Capture and Analyze</Button>
      )}
      <Button  color="info" size="medium" style={{background: 'blue', color: 'white',  margin: 5, marginBottom: 20}}  onClick={handleCameraCapture}>Capture from Camera</Button>
      {loading && <CircularProgress style={{ margin: "20px" }} />}
      {errorMessage && (
        <p style={{ color: "red", margin: "20px" }}>{errorMessage}</p>
      )}
      {selectedImage ? (
        <div>
          <p>Uploaded Image:</p>
          <img
            src={URL.createObjectURL(selectedImage)}
            alt="Uploaded"
            style={{ maxWidth: "400px", maxHeight: "400px", margin: "0 auto" }}
          />
          <h3 style={{ margin: "20px" }}>Expression: {expression}</h3>
          <h3 style={{ margin: "20px" }}>
            Mental Ability: {interpretMentalAbility(mentalAbility)}
          </h3>
          {landmarks && landmarks.length > 0 && (
            <svg
              style={{ position: "absolute", top: 0, left: 0 }}
              width="100%"
              height="100%"
            >
              {landmarks.map((point, index) => (
                <circle
                  key={index}
                  cx={point._x}
                  cy={point._y}
                  r="2"
                  fill="red"
                />
              ))}
            </svg>
          )}
        </div>
      ) : (
        <video ref={videoRef} style={{ maxWidth: "50%", maxHeight: "50%" }} />
      )}
    </div>
  );
};

export default FaceAnalyzer;
