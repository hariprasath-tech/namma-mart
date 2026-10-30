import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ArrowLeft,
  Video,
  Camera,
  Play,
  Pause,
  Upload,
  ShieldCheck,
  Cpu,
  Users,
  Grid,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface ZoneCount {
  zoneIndex: number;
  row: number;
  col: number;
  count: number;
}

export const PersonCountingDemoPage: React.FC = () => {
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [personCount, setPersonCount] = useState(0);
  const [zoneCounts, setZoneCounts] = useState<number[]>(Array(9).fill(0));
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [useWebcam, setUseWebcam] = useState(false);
  const [statusText, setStatusText] = useState('Select a video file or enable webcam to begin');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Lazy-load TensorFlow.js and COCO-SSD
  const loadModel = async () => {
    if (modelRef.current) return modelRef.current;
    setModelLoading(true);
    setStatusText('Loading pretrained COCO-SSD model (TensorFlow.js)...');
    try {
      await import('@tensorflow/tfjs');
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      const loaded = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      modelRef.current = loaded;
      setModelLoaded(true);
      setStatusText('Pretrained model loaded locally. Ready for inference.');
      return loaded;
    } catch (e) {
      console.error('Error loading COCO-SSD:', e);
      setStatusText('Failed to load TensorFlow.js model in this browser.');
      return null;
    } finally {
      setModelLoading(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (useWebcam) {
      stopWebcam();
      setUseWebcam(false);
    }

    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setStatusText(`Loaded local video: ${file.name}`);
  };

  const handleToggleWebcam = async () => {
    if (useWebcam) {
      stopWebcam();
      setUseWebcam(false);
      setVideoSrc(null);
      setStatusText('Webcam stopped.');
    } else {
      try {
        setStatusText('Requesting webcam stream...');
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setUseWebcam(true);
        setVideoSrc(null);
        setStatusText('Live webcam active. Starting person detection...');
        startDetection();
      } catch (err) {
        console.error('Webcam access error:', err);
        setStatusText('Could not access webcam. Please upload a local video instead.');
      }
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Inference loop
  const runDetectionLoop = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const model = modelRef.current;

    if (!video || !canvas || !model || video.paused || video.ended) {
      animFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
      return;
    }

    if (video.readyState >= 2) {
      // Set canvas size to match video
      const vWidth = video.videoWidth || 640;
      const vHeight = video.videoHeight || 480;

      if (canvas.width !== vWidth || canvas.height !== vHeight) {
        canvas.width = vWidth;
        canvas.height = vHeight;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, vWidth, vHeight);

        // Run object detection
        const predictions = await model.detect(video);

        // Filter strictly for person class
        const personDetections = predictions.filter(
          (p: any) => p.class === 'person' && p.score >= 0.4
        );

        setPersonCount(personDetections.length);

        // 3x3 Grid zone count tracker
        const gridCounts = Array(9).fill(0);

        // Draw 3x3 Grid on canvas
        ctx.strokeStyle = 'rgba(255, 180, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        const colW = vWidth / 3;
        const rowH = vHeight / 3;

        ctx.beginPath();
        // Verticals
        ctx.moveTo(colW, 0); ctx.lineTo(colW, vHeight);
        ctx.moveTo(colW * 2, 0); ctx.lineTo(colW * 2, vHeight);
        // Horizontals
        ctx.moveTo(0, rowH); ctx.lineTo(vWidth, rowH);
        ctx.moveTo(0, rowH * 2); ctx.lineTo(vWidth, rowH * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw bounding boxes for persons
        for (const det of personDetections) {
          const [x, y, width, height] = det.bbox;

          // Compute person centroid
          const cx = x + width / 2;
          const cy = y + height / 2;

          const colIdx = Math.min(2, Math.max(0, Math.floor(cx / colW)));
          const rowIdx = Math.min(2, Math.max(0, Math.floor(cy / rowH)));
          const zoneIdx = rowIdx * 3 + colIdx;
          gridCounts[zoneIdx] += 1;

          // Draw box
          ctx.strokeStyle = '#FFB400';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          // Draw label badge
          ctx.fillStyle = '#0E3B2C';
          const label = `Person · ${(det.score * 100).toFixed(0)}%`;
          ctx.font = 'bold 12px sans-serif';
          const textWidth = ctx.measureText(label).width;
          ctx.fillRect(x, Math.max(0, y - 22), textWidth + 10, 20);

          ctx.fillStyle = '#FFB400';
          ctx.fillText(label, x + 5, Math.max(14, y - 8));
        }

        setZoneCounts(gridCounts);
      }
    }

    animFrameIdRef.current = requestAnimationFrame(runDetectionLoop);
  };

  const startDetection = async () => {
    let model = modelRef.current;
    if (!model) {
      model = await loadModel();
      if (!model) return;
    }

    if (videoRef.current) {
      videoRef.current.play();
    }
    setDetecting(true);
    setStatusText('Running client-side person detection locally in WebAssembly...');
    runDetectionLoop();
  };

  const stopDetection = () => {
    setDetecting(false);
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setStatusText('Detection paused.');
  };

  useEffect(() => {
    return () => {
      stopDetection();
      stopWebcam();
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header and Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#0E3B2C] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Owner Dashboard</span>
        </Link>

        <Badge variant="marigold" size="sm" className="font-bold">
          TRL 3 Demo · Client-Side Inference
        </Badge>
      </div>

      {/* Main Banner */}
      <div className="bg-[#0E3B2C] text-white rounded-2xl p-6 shadow-md border border-[#1F6B4A] space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#FFB400]">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight">
              In-Browser Person Counting Demo
            </h1>
            <p className="text-xs text-white/80">
              Evaluates real person detection in the client using a pretrained TensorFlow.js model.
            </p>
          </div>
        </div>

        {/* Mandatory Academic Honesty Label (Section 1 & Section 8) */}
        <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-xs text-[#FFB400] flex items-center gap-2 mt-3">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#FFB400]" />
          <span>
            <strong>Academic Disclosure:</strong> Pretrained COCO-SSD model (MobileNet v2), not trained by the team. Accuracy is not claimed. 100% in-browser processing; video never leaves the store device.
          </span>
        </div>
      </div>

      {/* Video Source Controls */}
      <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* File Picker */}
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F7F9F4] hover:bg-[#EEF3EA] border border-[#BDCBB8] text-xs font-bold text-[#0E3B2C] cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-[#1F6B4A]" />
            <span>Select Local Video File (.mp4 / .webm)</span>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
          </label>

          {/* Webcam Toggle */}
          <button
            onClick={handleToggleWebcam}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
              useWebcam
                ? 'bg-[#D63A2F] text-white border-[#D63A2F]'
                : 'bg-[#F7F9F4] hover:bg-[#EEF3EA] text-[#0E3B2C] border-[#BDCBB8]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{useWebcam ? 'Stop Live Webcam' : 'Use Live Webcam'}</span>
          </button>
        </div>

        {/* Play/Pause Detection */}
        <div className="flex items-center gap-2">
          {!detecting ? (
            <Button
              variant="palm"
              size="sm"
              onClick={startDetection}
              disabled={modelLoading || (!videoSrc && !useWebcam)}
              className="text-xs font-bold"
            >
              {modelLoading ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading Model...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Person Detection</span>
                </span>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={stopDetection}
              className="text-xs font-bold border-[#D63A2F] text-[#D63A2F]"
            >
              <Pause className="w-3.5 h-3.5 mr-1" />
              <span>Pause Detection</span>
            </Button>
          )}
        </div>
      </div>

      {/* Live Video Canvas Viewport */}
      <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#DDE5D9] pb-3 text-xs">
          <span className="font-mono text-[#4E6057]">STATUS: {statusText}</span>
          <div className="flex items-center gap-3">
            <Badge variant="grove" size="sm">
              👥 {personCount} People Detected Now
            </Badge>
          </div>
        </div>

        {/* Canvas & Video Stack */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border-2 border-[#1F6B4A]">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : useWebcam ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center text-white/60 p-6 space-y-2">
              <Video className="w-12 h-12 mx-auto text-white/30" />
              <p className="text-sm font-semibold">No video loaded</p>
              <p className="text-xs text-white/40">
                Click "Select Local Video File" or "Use Live Webcam" above to run client-side person detection.
              </p>
            </div>
          )}

          {/* Canvas Overlay for Bounding Boxes and 3x3 Grid */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
        </div>
      </div>

      {/* 3x3 Zone Density Matrix */}
      <div className="bg-white rounded-2xl p-5 border border-[#DDE5D9] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#DDE5D9] pb-2">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-[#0E3B2C]" />
            <h3 className="font-display font-bold text-sm text-[#14201B]">
              3 × 3 Frame Zone Matrix (Spatial Density)
            </h3>
          </div>
          <span className="text-[11px] text-[#4E6057]">Centroid polygon tracking</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto text-center text-xs">
          {zoneCounts.map((count, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all ${
                count > 0
                  ? 'bg-[#EEF3EA] border-[#1F6B4A] text-[#0E3B2C] font-bold shadow-xs'
                  : 'bg-[#F7F9F4] border-[#DDE5D9] text-[#4E6057]'
              }`}
            >
              <span className="text-[10px] uppercase font-bold block text-[#4E6057]">
                Zone {idx + 1}
              </span>
              <span className="font-display font-extrabold text-lg mt-0.5 block">
                {count} {count === 1 ? 'person' : 'people'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
