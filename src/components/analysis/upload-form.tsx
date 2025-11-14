"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, Video, Sparkles, Waves, PlayCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface UploadFormProps {
  onFileUpload: (file: File) => void;
}

export default function UploadForm({ onFileUpload }: UploadFormProps) {
  const [dragActive, setDragActive] = useState(false);
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
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="relative flex items-center justify-center w-full">
      <Card className="w-full max-w-3xl text-center shadow-xl border border-mocha/30 bg-gradient-to-br from-[#6B4423] to-[#4A2C1A] backdrop-blur">
        <CardHeader>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <CardTitle className="text-4xl font-extrabold tracking-tight flex items-center justify-center gap-2 text-ivory">
              <Sparkles className="h-6 w-6 text-gold" /> Smart Meeting Analysis
            </CardTitle>
            <CardDescription className="text-base text-taupe mt-2">
              Upload a meeting video to generate transcript, speakers, and insights.
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="p-8">
          <div id="form-file-upload" onDragEnter={handleDrag}>
            <input
              ref={inputRef}
              type="file"
              id="input-file-upload"
              className="hidden"
              accept=".mp4,.avi,.mkv,.mov,.webm"
              onChange={handleChange}
            />
            <motion.label
              id="label-file-upload"
              htmlFor="input-file-upload"
              className={`relative flex flex-col items-center justify-center w-full h-72 rounded-2xl cursor-pointer bg-gradient-to-br from-cocoa/50 via-espresso to-cocoa/30 border border-mocha/30 backdrop-blur group overflow-hidden`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.995 }}
            >
              <motion.div
                className="absolute inset-0 bg-[radial-gradient(transparent,transparent,rgba(0,0,0,0.03))]"
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 6 }}
              />
              <div className={`absolute inset-0 border-2 border-dashed ${dragActive ? "border-gold/70" : "border-mocha/60"}`} />
              <div className="flex flex-col items-center justify-center pt-5 pb-6 z-10">
                <motion.div animate={{ rotate: dragActive ? 10 : 0 }} transition={{ type: "spring", stiffness: 200 }}>
                  <UploadCloud className="w-14 h-14 mb-3 text-mocha" />
                </motion.div>
                <p className="mb-2 text-lg font-semibold text-ivory">
                  <span className="font-bold text-gold">Click to upload</span> or drag and drop
                </p>
                <p className="text-sm text-taupe">MP4, AVI, MKV, MOV, or WEBM</p>
              </div>
              {dragActive && <div className="absolute inset-0 w-full h-full" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
            </motion.label>
          </div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Button onClick={onButtonClick} className="mt-6 w-full max-w-sm bg-gradient-to-r from-mocha to-caramel hover:from-mocha-light hover:to-caramel-light text-ivory" size="lg">
              <PlayCircle className="mr-2 h-5 w-5" />
              Select Video File
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
