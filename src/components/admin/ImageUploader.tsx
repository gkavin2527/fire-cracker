"use client";

import { useState, useRef, useEffect } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  folder?: string;
  isSubmitting?: boolean;
}

export default function ImageUploader({ onUploadSuccess, folder = 'images', isSubmitting = false }: ImageUploaderProps) {
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadComplete(false); // Reset completion state on new file selection
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please select a file smaller than 5MB.", variant: "destructive" });
        return;
      }
      setFileToUpload(selectedFile); // This will trigger the useEffect to upload
    }
  };

  useEffect(() => {
    const uploadFile = async () => {
      if (!fileToUpload) return;
      if (!storage) {
        toast({ title: "Upload Error", description: "Firebase Storage is not configured. Check console.", variant: "destructive" });
        return;
      }
    
      setIsUploading(true);
      setUploadComplete(false);

      try {
        const storageRef = ref(storage, `${folder}/${Date.now()}-${fileToUpload.name}`);
        await uploadBytes(storageRef, fileToUpload);
        const downloadURL = await getDownloadURL(storageRef);

        toast({ title: "Upload Successful" });
        onUploadSuccess(downloadURL);
        setUploadComplete(true);

      } catch (error: any) {
        console.error("Upload failed:", error);
        let description = "An unknown error occurred during upload. Check your Firebase Storage security rules to allow writes.";
        if (error.code) {
          switch(error.code) {
            case 'storage/unauthorized':
              description = "Permission denied. Your Firebase Storage rules must allow writes for authenticated users.";
              break;
            case 'storage/object-not-found':
              description = "File could not be found after upload. Check storage rules for read access.";
              break;
            default:
              description = `Upload failed with code: ${error.code}. Check browser console for details.`;
          }
        }
        toast({ title: "Upload Failed", description: description, variant: "destructive", duration: 9000 });
      } finally {
        setIsUploading(false);
        setFileToUpload(null); 
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };

    uploadFile();
  }, [fileToUpload, folder, onUploadSuccess, toast]);

  const getStatusContent = () => {
    if (isUploading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Uploading...
        </>
      );
    }
    if (uploadComplete) {
       return (
        <>
          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          Upload Complete
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
      <label htmlFor="file-upload" className={cn(
        "flex items-center justify-center w-full h-10 px-3 py-2 text-sm ring-offset-background",
        "border border-input bg-background rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
        (isUploading || isSubmitting) && "cursor-not-allowed opacity-50"
      )}>
        {getStatusContent()}
      </label>
      <Input 
          id="file-upload"
          ref={fileInputRef}
          type="file" 
          accept="image/png, image/jpeg, image/gif, image/webp" 
          onChange={handleFileChange} 
          disabled={isUploading || isSubmitting}
          className="sr-only"
      />
    </div>
  );
}