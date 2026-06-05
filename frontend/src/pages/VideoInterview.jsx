import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import VideoRecorder from '../components/VideoRecorder';
import { applicationsAPI } from '../services/api';

export default function VideoInterview() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRecorded = (file) => {
    setVideoFile(file);
    setMessage('Recording ready. Click Upload to submit.');
  };

  const handleUpload = async () => {
    if (!videoFile) {
      setMessage('Please record a video first.');
      return;
    }
    setUploading(true);
    try {
      await applicationsAPI.uploadVideo(appId, videoFile);
      setMessage('Video interview uploaded successfully!');
      setTimeout(() => navigate('/dashboard/candidate'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout title="Video Interview">
      <div className="max-w-2xl">
        <p className="text-slate-600 mb-6">
          Record a short video introduction. Allow camera and microphone access when prompted.
        </p>
        <VideoRecorder onRecorded={handleRecorded} disabled={uploading} />
        {message && (
          <p className="mt-4 text-sm text-brand-700 bg-brand-50 p-3 rounded-lg">{message}</p>
        )}
        <button
          onClick={handleUpload}
          disabled={!videoFile || uploading}
          className="mt-6 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload Interview Video'}
        </button>
      </div>
    </Layout>
  );
}
