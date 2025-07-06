
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
  const [lastUploadStatus, setLastUploadStatus] = useState<'success' | 'error' | null>(null);
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
    setLastUploadStatus(null);

    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Wrap the upload task in a promise to use with async/await
      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            // This is the primary error handler from the upload task
            console.error("Firebase Upload Error:", error);
            reject(error); // Reject the promise on error
          },
          async () => {
            // This runs when the upload task itself is complete
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              onUploadSuccess(downloadURL);
              setLastUploadStatus('success');
              toast({ title: "Upload Successful" });
              resolve(); // Resolve the promise on success
            } catch (getUrlError) {
              // This catches errors from getDownloadURL (like permission errors)
              console.error("getDownloadURL Error:", getUrlError);
              reject(getUrlError); // Reject the promise if getting URL fails
            }
          }
        );
      });
    } catch (error: any) {
      setLastUploadStatus('error');
      let description = "An unknown error occurred during upload.";
      if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            description = "Permission denied. Your Firebase Storage rules must allow writes for authenticated users and allow public read to get the URL.";
            break;
          case 'storage/canceled':
            description = "Upload was cancelled.";
            break;
          default:
            description = `Upload failed. Code: ${error.code}. Check console for details.`;
        }
      }
      toast({ title: "Upload Failed", description, variant: "destructive", duration: 9000 });
    } finally {
      // This block is GUARANTEED to run after the try/catch block,
      // ensuring the UI always resets.
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the file input
      }
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
    if (lastUploadStatus === 'success') {
       return (
        <>
          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          Upload Complete! Choose another.
        </>
      );
    }
     if (lastUploadStatus === 'error') {
       return (
        <>
          <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
          Upload Failed. Try again.
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
