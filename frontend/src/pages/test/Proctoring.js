import React, { useEffect, useRef, useState } from 'react';
import * as faceDetection from '@tensorflow-models/face-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

export default function Proctoring({  onWarning, className }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const lastWarningRef = useRef(Date.now());
  const WARNING_COOLDOWN = 3000;

  useEffect(() => {
    let detectionInterval;

    const initializeProctoring = async () => {
      try {
        // Initialize TensorFlow backend
        await tf.ready();
        
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640,
            height: 480,
            facingMode: 'user'
          } 
        });
        
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Initialize face detection
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = {
          runtime: 'tfjs',
        };
        
        detectorRef.current = await faceDetection.createDetector(model, detectorConfig);
        setIsInitialized(true);

        // Start detection loop
        detectionInterval = setInterval(detectFaces, 2000);
      } catch (err) {
        console.error('Proctoring initialization error:', err);
        setError(err.message);
        onWarning('Failed to initialize proctoring system. Please check your camera permissions.');
      }
    };

    const detectFaces = async () => {
      if (!videoRef.current || !isInitialized || !detectorRef.current) return;

      try {
        // Ensure video is playing and has valid dimensions
        if (videoRef.current.readyState !== 4 || !videoRef.current.videoWidth) {
          console.log('Video not ready yet');
          return;
        }

        const detections = await detectorRef.current.estimateFaces(videoRef.current);
        const now = Date.now();
        
        // Only process warnings if enough time has passed since the last warning
        if (now - lastWarningRef.current >= WARNING_COOLDOWN) {
          // Log detections for debugging
          console.log('Face detections:', detections);

          if (detections.length === 0) {
            lastWarningRef.current = now;
            onWarning('No face detected in camera view');
          } else if (detections.length > 1) {
            lastWarningRef.current = now;
            onWarning('Multiple faces detected in camera view');
          }
          // Note: Add electronic gadgets detection logic here when implemented
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }
    };

    initializeProctoring();

    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isInitialized, onWarning]);

  // Add video metadata handler
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };
    }
  }, []);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      <div className="absolute top-2 right-2 flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-1" />
        <span className="text-xs text-white">Recording</span>
      </div>
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <p className="text-white text-sm text-center px-2">{error}</p>
        </div>
      )}
    </div>
  );
}