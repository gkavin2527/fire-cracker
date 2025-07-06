
"use client";

import { useState, useRef } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  folder?: string;
  isSubmitting?: boolean;
}

export default function ImageUploader({ onUploadSuccess, folder = 'images', isSubmitting = false }: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
       if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please select a file smaller than 5MB.", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "No file selected", description: "Please choose a file to upload.", variant: "destructive" });
      return;
    }
     if (!storage) {
        toast({ title: "Upload Error", description: "Firebase Storage is not configured. Check console.", variant: "destructive" });
        return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);

    const storageRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed:", error);
        toast({ title: "Upload Failed", description: "Please check storage rules and try again.", variant: "destructive" });
        setIsUploading(false);
        setUploadProgress(null);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          toast({ title: "Upload Successful" });
          onUploadSuccess(downloadURL);
          setIsUploading(false);
          setFile(null); // Clear the file state
          if(fileInputRef.current) {
            fileInputRef.current.value = ""; // Clear the file input element
          }
        });
      }
    );
  };

  return (
    <div className="space-y-2 p-3 border rounded-md bg-muted/30">
        <div className="flex items-center gap-2">
            <Input 
                ref={fileInputRef}
                type="file" 
                accept="image/png, image/jpeg, image/gif, image/webp" 
                onChange={handleFileChange} 
                disabled={isUploading || isSubmitting}
                className="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-primary file:font-medium hover:file:bg-primary/20"
            />
            <Button type="button" onClick={handleUpload} disabled={!file || isUploading || isSubmitting}>
            <Upload className={cn("mr-2 h-4 w-4", isUploading && "animate-spin")} />
            {isUploading ? `${Math.round(uploadProgress || 0)}%` : 'Upload'}
            </Button>
        </div>
        {uploadProgress !== null && (
            <Progress value={uploadProgress} className="w-full h-1" />
        )}
    </div>
  );
}
