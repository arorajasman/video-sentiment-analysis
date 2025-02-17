import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

function App() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [captureVideo, setCaptureVideo] = useState(false);

  const videoRef = useRef();
  const canvasRef = useRef();
  const videoHeight = 480;
  const videoWidth = 640;

  // Method to start the video
  const startVideo = () => {
    setCaptureVideo(true);
    navigator.mediaDevices
      .getUserMedia({ video: { width: videoWidth, height: videoHeight } })
      .then((stream) => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => {
        console.error("error:", err);
      });
  };

  // Method to close the webcam
  const closeWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.pause();
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setCaptureVideo(false);
  };

  // Effect to load the models initially
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  // Effect to handle face detection on video play
  useEffect(() => {
    let intervalId;

    const detectFaces = async () => {
      if (!canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext("2d");

      const displaySize = { width: videoWidth, height: videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      context.clearRect(0, 0, videoWidth, videoHeight);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    };

    if (captureVideo && modelsLoaded) {
      intervalId = setInterval(detectFaces, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [captureVideo, modelsLoaded]);

  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px" }}>
        {captureVideo && modelsLoaded ? (
          <button
            onClick={closeWebcam}
            style={{
              cursor: "pointer",
              backgroundColor: "green",
              color: "white",
              padding: "15px",
              fontSize: "25px",
              border: "none",
              borderRadius: "10px",
            }}
          >
            Close Webcam
          </button>
        ) : (
          <button
            onClick={startVideo}
            style={{
              cursor: "pointer",
              backgroundColor: "green",
              color: "white",
              padding: "15px",
              fontSize: "25px",
              border: "none",
              borderRadius: "10px",
            }}
          >
            Open Webcam
          </button>
        )}
      </div>
      {captureVideo && modelsLoaded ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "10px",
            position: "relative",
          }}
        >
          <video
            ref={videoRef}
            height={videoHeight}
            width={videoWidth}
            style={{ borderRadius: "10px" }}
          />
          <canvas
            ref={canvasRef}
            width={videoWidth}
            height={videoHeight}
            style={{
              position: "absolute",
              top: 0,
              left: 400,
              pointerEvents: "none",
            }}
          />
        </div>
      ) : modelsLoaded ? (
        <div>Loading...</div>
      ) : null}
    </div>
  );
}

export default App;
