
"use client";

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, XCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ImageDropzoneProps {
  initialImageUrl?: string | null;
  onUrlChange: (url: string) => void;
  folder?: string; // e.g., 'products', 'categories'
}

export default function ImageDropzone({ initialImageUrl, onUrlChange, folder = 'images' }: ImageDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialImageUrl || null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Sync preview with initialImageUrl prop
    setPreview(initialImageUrl || null);
  }, [initialImageUrl]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setUploadProgress(null);
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        setError("File is too large. Max size is 5MB.");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      handleUpload(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
      'image/webp': []
    },
    multiple: false,
  });

  const handleUpload = (fileToUpload: File) => {
    if (!storage) {
        toast({ title: "Upload Error", description: "Firebase Storage is not configured. Check console.", variant: "destructive" });
        setError("Storage service not available.");
        return;
    }
    if (!fileToUpload) return;

    const storageRef = ref(storage, `${folder}/${Date.now()}-${fileToUpload.name}`);
    const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

    setUploadProgress(0);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (uploadError) => {
        console.error("Upload error:", uploadError);
        let errorMessage = "File upload failed. Please try again.";
        if (uploadError.code === 'storage/unauthorized') {
            errorMessage = "Permission denied. Please ensure Firebase Storage rules allow writes.";
            toast({
                title: "Storage Permission Error",
                description: "You do not have permission to upload files. The admin needs to configure Firebase Storage security rules.",
                variant: "destructive",
                duration: 9000,
            });
        } else {
             toast({ title: "Upload Failed", description: errorMessage, variant: "destructive" });
        }
        setError(errorMessage);
        setUploadProgress(null);
        setFile(null);
        setPreview(initialImageUrl || null); // Revert to initial image on failure
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          onUrlChange(downloadURL);
          setUploadProgress(100);
          toast({ title: "Upload Successful", description: "Image has been uploaded." });
        });
      }
    );
  };
  
  const handleRemoveImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // prevent triggering the dropzone click
    setFile(null);
    setPreview(null);
    onUrlChange(""); // Clear the URL in the form
    setUploadProgress(null);
    setError(null);
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
        "hover:border-primary hover:bg-primary/5",
        isDragActive ? "border-primary bg-primary/10" : "border-border",
        error ? "border-destructive bg-destructive/10" : ""
      )}
    >
      <input {...getInputProps()} />
      {preview ? (
        <div className="relative w-full h-40 group">
          <Image src={preview} alt="Image preview" layout="fill" objectFit="contain" className="rounded-md" />
           <button 
              type="button" 
              onClick={handleRemoveImage} 
              className="absolute top-1 right-1 bg-background/70 rounded-full p-1 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
           >
             <XCircle className="w-6 h-6" />
           </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
          <UploadCloud className="w-12 h-12" />
          <p>
            {isDragActive ? "Drop the image here..." : "Drag 'n' drop an image here, or click to select"}
          </p>
          <p className="text-xs">PNG, JPG, GIF, WEBP up to 5MB</p>
        </div>
      )}
      {uploadProgress !== null && uploadProgress < 100 && (
          <Progress value={uploadProgress} className="mt-2 h-2" />
      )}
      {uploadProgress === 100 && (
          <div className="flex items-center justify-center mt-2 text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span>Upload complete</span>
          </div>
      )}
      {error && (
        <div className="flex items-center justify-center mt-2 text-destructive">
          <XCircle className="w-4 h-4 mr-1" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
