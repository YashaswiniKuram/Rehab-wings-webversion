import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for MediaPipe hand gesture detection in the browser.
 * Detects closed-hand gesture (same logic as the desktop Python version).
 */
export default function useHandGesture(onFlap) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const handLandmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const prevHandClosed = useRef(false);
  const onFlapRef = useRef(onFlap);

  // Keep the callback ref updated
  useEffect(() => {
    onFlapRef.current = onFlap;
  }, [onFlap]);

  /**
   * Check if hand is closed using the same logic as the Python version:
   * All finger tips (8,12,16,20) should be below their PIP joints (6,10,14,18)
   */
  const isHandClosed = useCallback((landmarks) => {
    return (
      landmarks[8].y > landmarks[6].y &&   // index finger
      landmarks[12].y > landmarks[10].y &&  // middle finger
      landmarks[16].y > landmarks[14].y &&  // ring finger
      landmarks[20].y > landmarks[18].y     // pinky
    );
  }, []);

  const start = useCallback(async () => {
    if (isActive || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      // Dynamically import MediaPipe
      const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs');
      const { HandLandmarker, FilesetResolver } = vision;

      const wasmFiles = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      const handLandmarker = await HandLandmarker.createFromOptions(wasmFiles, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });

      handLandmarkerRef.current = handLandmarker;

      // Get webcam stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setIsLoading(false);

      // Start detection loop
      const detect = () => {
        if (!videoRef.current || !handLandmarkerRef.current) return;
        if (videoRef.current.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(detect);
          return;
        }

        const results = handLandmarkerRef.current.detectForVideo(
          videoRef.current,
          performance.now()
        );

        // Draw hand landmarks on overlay canvas
        if (canvasRef.current && results.landmarks) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          for (const landmarks of results.landmarks) {
            const closed = isHandClosed(landmarks);

            // Draw landmarks
            for (const point of landmarks) {
              ctx.beginPath();
              ctx.arc(
                point.x * canvasRef.current.width,
                point.y * canvasRef.current.height,
                3,
                0,
                Math.PI * 2
              );
              ctx.fillStyle = closed ? '#EF4444' : '#4FC3F7';
              ctx.fill();
            }

            // Trigger flap on hand close (edge detection)
            if (closed && !prevHandClosed.current) {
              onFlapRef.current?.();
            }
            prevHandClosed.current = closed;
          }

          if (results.landmarks.length === 0) {
            prevHandClosed.current = false;
          }
        }

        animFrameRef.current = requestAnimationFrame(detect);
      };

      animFrameRef.current = requestAnimationFrame(detect);
    } catch (err) {
      console.error('Hand gesture setup error:', err);
      setError(err.message || 'Failed to start hand gesture detection');
      setIsLoading(false);
    }
  }, [isActive, isLoading, isHandClosed]);

  const stop = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (handLandmarkerRef.current) {
      handLandmarkerRef.current.close();
      handLandmarkerRef.current = null;
    }
    setIsActive(false);
    prevHandClosed.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    videoRef,
    canvasRef,
    isActive,
    isLoading,
    error,
    start,
    stop,
    toggle: isActive ? stop : start,
  };
}
