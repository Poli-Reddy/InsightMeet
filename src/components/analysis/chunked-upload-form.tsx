"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { config } from "@/lib/config";

import type { AnalysisMode } from "@/lib/types";

interface ChunkedUploadFormProps {
  analysisMode: AnalysisMode;
  onUploadComplete: (analysisId: string) => void;
  onUploadStart?: () => void; // Callback when upload starts
}

const CHUNK_SIZE = config.upload.chunkSize;

export default function ChunkedUploadForm({ analysisMode, onUploadComplete, onUploadStart }: ChunkedUploadFormProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      // Automatically start upload
      uploadFileDirectly(file);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Automatically start upload
      uploadFileDirectly(file);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const uploadFileDirectly = async (file: File) => {
    try {
      // Immediately show loading screen
      if (onUploadStart) {
        onUploadStart();
      }

      const fileSizeMB = file.size / (1024 * 1024);
      const thresholdMB = config.upload.chunkThreshold / (1024 * 1024);
      
      // For files under threshold, use direct upload (simpler and faster)
      if (file.size < config.upload.chunkThreshold) {
        console.log(`File size ${fileSizeMB.toFixed(2)}MB (threshold: ${thresholdMB}MB) - using direct upload`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', analysisMode);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          throw new Error(error.error || 'Upload failed');
        }

        const { id: analysisId } = await uploadRes.json();
        onUploadComplete(analysisId);
        return;
      }

      // For files 50MB and above, use chunked upload
      console.log(`File size ${fileSizeMB.toFixed(2)}MB - using chunked upload`);
      
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      // Step 1: Initialize upload
      const initRes = await fetch('/api/upload-chunk?action=init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          totalChunks,
        }),
      });

      if (!initRes.ok) {
        const error = await initRes.json();
        throw new Error(error.error || 'Failed to initialize upload');
      }

      const { uploadId } = await initRes.json();

      // Step 2: Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);

        const uploadRes = await fetch(
          `/api/upload-chunk?action=upload&uploadId=${uploadId}&chunkIndex=${i}`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload chunk ${i + 1}`);
        }
      }

      // Step 3: Complete upload and process
      const completeRes = await fetch('/api/upload-chunk?action=complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, mode: analysisMode }),
      });

      if (!completeRes.ok) {
        const error = await completeRes.json();
        throw new Error(error.error || 'Failed to complete upload');
      }

      const { analysisId } = await completeRes.json();
      onUploadComplete(analysisId);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage(error.message || 'Upload failed');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setErrorMessage('');
  };

  return (
    <Card className="w-full max-w-3xl mx-auto text-center shadow-xl border border-mocha/30 bg-gradient-to-br from-[#6B4423]/80 to-[#4A2C1A]/80 backdrop-blur">
      <CardHeader>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <CardTitle className="text-4xl font-extrabold tracking-tight flex items-center justify-center gap-2 text-ivory">
            <UploadCloud className="h-6 w-6 text-gold" /> Smart Meeting Analysis
          </CardTitle>
          <CardDescription className="text-base text-taupe mt-2">
            Upload large meeting videos with progress tracking and resume support
          </CardDescription>
        </motion.div>
      </CardHeader>
      <CardContent className="p-8">
        <AnimatePresence mode="wait">
          {!selectedFile && uploadStatus === 'idle' && (
            <motion.div
              key="upload-area"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div id="form-file-upload" onDragEnter={handleDrag}>
                <input
                  ref={inputRef}
                  type="file"
                  id="input-file-upload"
                  className="hidden"
                  accept={config.upload.acceptedTypes.join(',')}
                  onChange={handleChange}
                />
                <motion.label
                  id="label-file-upload"
                  htmlFor="input-file-upload"
                  className={`relative flex flex-col items-center justify-center w-full h-72 rounded-2xl cursor-pointer bg-gradient-to-br from-cocoa/50 via-espresso to-cocoa/30 border border-mocha/30 backdrop-blur group overflow-hidden`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.995 }}
                >
                  <div className={`absolute inset-0 border-2 border-dashed ${dragActive ? "border-gold/70" : "border-mocha/60"}`} />
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10">
                    <motion.div animate={{ rotate: dragActive ? 10 : 0 }} transition={{ type: "spring", stiffness: 200 }}>
                      <UploadCloud className="w-14 h-14 mb-3 text-mocha" />
                    </motion.div>
                    <p className="mb-2 text-lg font-semibold text-ivory">
                      <span className="font-bold text-gold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-taupe">MP4, AVI, MKV, MOV, or WEBM (up to {Math.round(config.upload.maxSize / (1024 * 1024))}MB)</p>
                  </div>
                  {dragActive && <div className="absolute inset-0 w-full h-full" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
                </motion.label>
              </div>
            </motion.div>
          )}



          {uploadStatus === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-8 space-y-4"
            >
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
              <p className="text-red-400 font-semibold text-lg">Upload Failed</p>
              <p className="text-taupe">{errorMessage}</p>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-mocha to-caramel hover:from-mocha-light hover:to-caramel-light text-ivory"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
