"use client";

import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud } from 'lucide-react';

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
}

export const ImageUploader = ({ onUploadComplete }: ImageUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "No File Selected", description: "Please select a file to upload first.", variant: "destructive" });
      return;
    }
    if (!storage) {
        toast({ title: "Firebase Error", description: "Firebase Storage is not configured. Cannot upload.", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);

    try {
      // 1. Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // 2. Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 3. Notify the parent form
      onUploadComplete(downloadURL);
      
      toast({ title: "Upload Successful", description: "Image URL has been populated below." });
      setFile(null); 

    } catch (error: any)
      {
      console.error("Image upload failed:", error);
      let errorMessage = "An unexpected error occurred during upload.";
      if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            errorMessage = "Permission Denied. Check your Firebase Storage security rules to allow uploads.";
            break;
          case 'storage/canceled':
            errorMessage = "Upload was canceled.";
            break;
        }
      }
      toast({ title: "Upload Failed", description: errorMessage, variant: "destructive" });
    } finally {
      // 4. THIS IS THE KEY: Always reset the loading state
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2 p-3 border rounded-md bg-muted/20">
      <p className="text-sm font-medium text-muted-foreground">Optional: Upload a new image</p>
      <div className="flex items-center gap-2">
        <Input 
          id="file-upload" 
          type="file" 
          onChange={handleFileChange} 
          accept="image/*" 
          className="flex-grow bg-background" 
          disabled={isUploading} 
        />
        <Button onClick={handleUpload} disabled={!file || isUploading} type="button">
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </div>
  );
};
