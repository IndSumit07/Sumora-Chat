import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, X, Image as ImageIcon, File, Loader } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { useTyping } from '../../hooks/useTyping.js';
import { useMediaUpload } from '../../hooks/useMediaUpload.js';
import { MESSAGE_TYPES } from '../../utils/constants.js';

export default function MessageInput({ conversationId, groupId, sendMessage, isSending, onMessageSent }) {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const isGroup = !!groupId;
  const roomId = conversationId || groupId;

  // sendMessage and isSending now come from props (parent's useMessages hook)
  const { handleInputChange, handleBlur, sendTypingStop } = useTyping(conversationId, groupId);
  const {
    uploading, uploadProgress, selectedFile, previewUrl, fileInputRef,
    selectFile, clearFile, uploadFile, isRecording, startRecording, stopRecording
  } = useMediaUpload({ conversationId, groupId });

  // Handle click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextChange = (e) => {
    setContent(e.target.value);
    handleInputChange();
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleEmojiSelect = (emoji) => {
    const cursor = inputRef.current?.selectionStart || content.length;
    const newContent = content.slice(0, cursor) + emoji.native + content.slice(cursor);
    setContent(newContent);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    sendTypingStop();
    
    let uploadedMedia = null;
    if (selectedFile) {
      uploadedMedia = await uploadFile();
      if (!uploadedMedia) return; // Upload failed
    }

    const messageData = {
      type: uploadedMedia ? uploadedMedia.type : MESSAGE_TYPES.TEXT,
      content: content.trim() || undefined,
    };

    if (uploadedMedia) {
      messageData.fileUrl = uploadedMedia.fileUrl;
      messageData.thumbnailUrl = uploadedMedia.thumbnailUrl;
      messageData.fileName = uploadedMedia.fileName;
      messageData.fileSize = uploadedMedia.fileSize;
      messageData.mimeType = uploadedMedia.mimeType;
      messageData.duration = uploadedMedia.duration;
    }

    // Clear input immediately for snappy UX
    const prevContent = content;
    setContent('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    sendMessage(messageData, {
      onSuccess: () => {
        if (onMessageSent) onMessageSent();
      },
      onError: () => {
        // Restore content on failure
        setContent(prevContent);
      },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative border-t border-border bg-bg-sidebar p-3 md:p-4">
      {/* File Preview */}
      {selectedFile && !isRecording && (
        <div className="mb-3 p-3 bg-bg-elevated rounded-xl border border-border flex items-center gap-4 relative">
          <button
            onClick={clearFile}
            className="absolute -top-2 -right-2 w-6 h-6 bg-bg-hover rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-border transition-colors border border-border shadow-sm z-10"
          >
            <X size={14} />
          </button>
          
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-border" />
          ) : (
            <div className="w-16 h-16 bg-bg-primary rounded-lg flex items-center justify-center border border-border text-accent">
              <File size={24} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{selectedFile.name}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
            {uploading && (
              <div className="w-full bg-bg-primary rounded-full h-1.5 mt-2">
                <div 
                  className="bg-accent h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Voice Recording Active State */}
      {isRecording && (
        <div className="mb-3 p-3 bg-bg-elevated rounded-xl border border-accent/30 flex items-center justify-between animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-text-primary font-medium">Recording voice note...</span>
          </div>
          <button
            onClick={stopRecording}
            className="text-sm font-medium text-accent hover:text-accent-light px-4 py-1.5 rounded-lg bg-accent/10"
          >
            Stop & Preview
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex items-center gap-1 sm:gap-2 mb-1">
          {/* Emoji Picker Toggle */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className="btn-icon w-10 h-10 flex-shrink-0"
              aria-label="Emojis"
            >
              <Smile size={20} className={showEmoji ? "text-accent" : ""} />
            </button>
            
            {showEmoji && (
              <div className="absolute bottom-12 left-0 z-50 shadow-menu">
                <Picker 
                  data={data} 
                  onEmojiSelect={handleEmojiSelect}
                  theme="dark"
                  previewPosition="none"
                  skinTonePosition="none"
                />
              </div>
            )}
          </div>

          {/* Attachment Toggle */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-icon w-10 h-10 flex-shrink-0"
            disabled={uploading || isRecording}
            aria-label="Attach file"
          >
            <Paperclip size={20} />
          </button>
          
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files?.[0]) selectFile(e.target.files[0]);
            }}
          />
        </div>

        {/* Text Input */}
        <div className="flex-1 min-w-0 bg-bg-elevated rounded-2xl border border-border focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/30 transition-all">
          <textarea
            ref={inputRef}
            value={content}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
            className="message-input w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-4 max-h-32 text-sm md:text-base scrollbar-hide"
            rows={1}
            disabled={uploading || isRecording}
          />
        </div>

        {/* Send / Mic Button */}
        <div className="flex items-center mb-1">
          {(content.trim() || selectedFile) ? (
            <button
              type="submit"
              disabled={isSending || uploading}
              className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent-light active:scale-95 transition-all shadow-glow-accent disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="Send message"
            >
              {(isSending || uploading) ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <Send size={18} className="ml-1" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={isRecording}
              className="btn-icon w-10 h-10 flex-shrink-0 hover:text-accent hover:bg-accent/10 transition-colors"
              aria-label="Record voice note"
            >
              <Mic size={20} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
