"use client";

import { useState, useCallback } from "react";
import { uploadResume } from "@/app/(dashboard)/profile/actions";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  X, 
  Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ResumeDropboxProps {
  currentResumeUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
}

export function ResumeDropbox({ currentResumeUrl, onUploadSuccess }: ResumeDropboxProps) {
  const [isPending, startTransition] = useTransition();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    setFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      startTransition(async () => {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const result = await uploadResume(formData);
          if (result && result.error) {
            toast.error(`Upload failed: ${result.error}`);
          } else if (result && result.success) {
            toast.success("Resume uploaded successfully!");
            setFile(null);
            if (onUploadSuccess && result.url) {
              onUploadSuccess(result.url);
            }
          }
        } catch (serverErr) {
          console.error("Server action error:", serverErr);
          toast.error("A server error occurred during upload.");
        }
      });
    } catch (clientErr) {
      console.error("Client transition error:", clientErr);
      toast.error("A client error occurred.");
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center text-center group",
          dragActive 
            ? "border-secondary bg-secondary/5" 
            : "border-border/60 hover:border-border hover:bg-muted/30",
          file ? "border-green-500/50 bg-green-500/5" : ""
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="resume-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={isPending}
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="h-16 w-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                <Upload className="h-8 w-8 text-secondary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold">
                  {currentResumeUrl ? "Update your resume" : "Upload your resume"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop your PDF here, or click to browse
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="h-16 w-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold truncate max-w-[200px]">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Button
              onClick={handleUpload}
              disabled={isPending}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Upload
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {currentResumeUrl && !file && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/5 border border-secondary/10">
          <FileText className="h-4 w-4 text-secondary" />
          <span className="text-xs font-medium truncate flex-1">
            resume_current.pdf
          </span>
          <a
            href={currentResumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-secondary uppercase hover:underline"
          >
            View
          </a>
        </div>
      )}
    </div>
  );
}
