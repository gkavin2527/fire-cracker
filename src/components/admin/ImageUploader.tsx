"use client";

import { useState, useCallback, useRef } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  folder?: string;
  isSubmitting?: boolean;
}

export default function ImageUploader({ onUploadSuccess, folder = 'images', isSubmitting = false }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please select a file smaller than 5MB.", variant: "destructive" });
        return;
      }
      handleUpload(selectedFile);
    }
  };

  const handleUpload = useCallback(async (file: File) => {
    if (!storage) {
      toast({ title: "Upload Error", description: "Firebase Storage is not configured. Check console.", variant: "destructive" });
      return;
    }
  
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadComplete(false);

    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload failed during transfer:", error);
          let description = "An unknown error occurred during upload.";
          if (error.code) {
            switch(error.code) {
              case 'storage/unauthorized':
                description = "Permission denied. Your Firebase Storage rules must allow writes for authenticated users.";
                break;
              case 'storage/canceled':
                description = "Upload was cancelled.";
                break;
              default:
                description = `Upload failed with code: ${error.code}.`;
            }
          }
          setUploadError(description);
          toast({ title: "Upload Failed", description: description, variant: "destructive", duration: 9000 });
          // Error state is set, the finally block will handle UI reset
          setIsUploading(false);
          setUploadProgress(null);
        }, 
        async () => {
          // Upload completed successfully, now get the download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onUploadSuccess(downloadURL);
            setUploadComplete(true);
            toast({ title: "Upload Successful" });
          } catch (getUrlError: any) {
              console.error("Failed to get download URL:", getUrlError);
              const description = "Upload succeeded, but could not get the file URL. Check your Storage read permissions.";
              setUploadError(description);
              toast({ title: "URL Fetch Failed", description, variant: "destructive", duration: 9000 });
          } finally {
             // Reset state after completion logic is done
            setIsUploading(false);
            setUploadProgress(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
          }
        }
      );
    } catch (error) {
      // This catches errors in the initial setup of the upload, not from the listener.
      console.error("Upload setup failed:", error);
      setUploadError("Could not start the upload process.");
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [folder, onUploadSuccess, toast]);


  const getStatusContent = () => {
    if (isUploading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Uploading...
        </>
      );
    }
    if (uploadError) {
       return (
        <>
          <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
          Upload Failed. Try again.
        </>
      );
    }
     if (uploadComplete) {
       return (
        <>
          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          Upload Complete!
        </>
      );
    }
    return (
       <>
        <Upload className="mr-2 h-4 w-4" />
        Choose a file to auto-upload
       </>
    );
  };

  return (
    <div className="space-y-2 p-3 border rounded-md bg-muted/30">
       <Input 
          id="file-upload"
          ref={fileInputRef}
          type="file" 
          accept="image/png, image/jpeg, image/gif, image/webp" 
          onChange={handleFileChange} 
          disabled={isUploading || isSubmitting}
          className="sr-only"
      />
      <label htmlFor="file-upload" className={cn(
        "flex items-center justify-center w-full h-10 px-3 py-2 text-sm ring-offset-background",
        "border border-input bg-background rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
        (isUploading || isSubmitting) && "cursor-not-allowed opacity-50"
      )}>
        {getStatusContent()}
      </label>

      {isUploading && uploadProgress !== null && (
         <div className="space-y-1">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{Math.round(uploadProgress)}%</p>
         </div>
      )}
    </div>
  );
}
