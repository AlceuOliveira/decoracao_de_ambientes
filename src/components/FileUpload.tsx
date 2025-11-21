import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Plus, Video } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (base64s: string[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

  const extractFrameFromVideo = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        // Seek to 1 second or 25% of duration to avoid black frames at start
        video.currentTime = Math.min(1, video.duration * 0.25);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.9);
          URL.revokeObjectURL(video.src);
          resolve(base64);
        } else {
          reject(new Error("Canvas context not available"));
        }
      };

      video.onerror = (e) => {
        reject(e);
      };
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    const imageFiles = fileList.filter(file => file.type.startsWith('image/'));
    const videoFiles = fileList.filter(file => file.type.startsWith('video/'));
    
    if (imageFiles.length === 0 && videoFiles.length === 0) return;
    
    const processedImages: string[] = [];

    // Process Images
    const imagePromises = imageFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
    });

    if (imagePromises.length > 0) {
        const imgs = await Promise.all(imagePromises);
        processedImages.push(...imgs);
    }

    // Process Videos (Extract Frames)
    if (videoFiles.length > 0) {
        setIsProcessingVideo(true);
        try {
            const videoPromises = videoFiles.map(file => extractFrameFromVideo(file));
            const videoFrames = await Promise.all(videoPromises);
            processedImages.push(...videoFrames);
        } catch (err) {
            console.error("Error processing video", err);
        } finally {
            setIsProcessingVideo(false);
        }
    }

    if (processedImages.length > 0) {
      onFilesSelected(processedImages);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div 
      className={`
        relative overflow-hidden transition-all duration-300
        border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center
        min-h-[280px] bg-white cursor-pointer group
        ${isDragging ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-400'}
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isProcessingVideo && inputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={inputRef} 
        className="hidden" 
        accept="image/*,video/*" 
        multiple
        onChange={(e) => e.target.files && processFiles(e.target.files)} 
      />
      
      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        {isProcessingVideo ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-stone-900"></div>
        ) : (
            <Upload className="w-6 h-6 text-stone-600" />
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-stone-900 mb-2">
        {isProcessingVideo ? 'Processando vídeo...' : 'Envie fotos ou vídeos'}
      </h3>
      <p className="text-stone-500 text-sm max-w-xs mx-auto mb-4">
        Arraste e solte imagens ou vídeos do ambiente.
        <br/>
        <span className="text-xs opacity-70">(Vídeos serão convertidos em imagens estáticas)</span>
      </p>
      
      <div className="flex items-center justify-center gap-4 text-[10px] font-medium text-stone-400 uppercase tracking-wider">
        <div className="flex items-center gap-1">
             <ImageIcon className="w-3 h-3" />
             <span>JPG, PNG</span>
        </div>
        <div className="flex items-center gap-1">
             <Video className="w-3 h-3" />
             <span>MP4, MOV</span>
        </div>
      </div>
    </div>
  );
};