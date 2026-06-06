import { useRef, useState, useEffect } from 'react';

export default function VideoRecorder({ onRecorded, disabled }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e) => {
        let finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          transcriptRef.current += finalTranscript;
        }
      };
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, [previewUrl]);

  const startRecording = async () => {
    try {
      setError('');
      transcriptRef.current = '';
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
        const file = new File([blob], `interview.${ext}`, { type: blob.type });
        onRecorded?.(file, url, transcriptRef.current.trim());
        stream.getTracks().forEach((t) => t.stop());
      };
      
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) {}
      }
      recorder.start(1000);
      setRecording(true);
    } catch (err) {
      setError('Camera/microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setRecording(false);
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video max-w-lg">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted={recording}
          src={!recording && previewUrl ? previewUrl : undefined}
          controls={!!previewUrl && !recording}
        />
        {recording && (
          <span className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            REC
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Start Recording
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
          >
            Stop Recording
          </button>
        )}
      </div>
    </div>
  );
}
