import { useState, useRef, useCallback } from 'react';
import { uploadApi } from '../api/upload.api.js';
import toast from 'react-hot-toast';

const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 25 * 1024 * 1024,
  document: 50 * 1024 * 1024,
};

const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};

export const useMediaUpload = ({ conversationId, groupId } = {}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = useCallback((file) => {
    const category = getFileCategory(file.type);
    const maxSize = MAX_FILE_SIZES[category];

    if (file.size > maxSize) {
      toast.error(`File too large. Max ${maxSize / (1024 * 1024)}MB for ${category}s.`);
      return false;
    }
    return true;
  }, []);

  const selectFile = useCallback((file) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, [validateFile]);

  const clearFile = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [previewUrl]);

  const uploadFile = useCallback(async () => {
    if (!selectedFile) return null;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (conversationId) formData.append('conversationId', conversationId);
      if (groupId) formData.append('groupId', groupId);

      const response = await uploadApi.uploadMessageFile(formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      });

      clearFile();
      return response.data.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  }, [selectedFile, conversationId, groupId, clearFile]);

  // Start voice note recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        selectFile(file);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Microphone access denied');
    }
  }, [selectFile]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  return {
    uploading,
    uploadProgress,
    selectedFile,
    previewUrl,
    fileInputRef,
    selectFile,
    clearFile,
    uploadFile,
    isRecording,
    startRecording,
    stopRecording,
  };
};

export default useMediaUpload;
