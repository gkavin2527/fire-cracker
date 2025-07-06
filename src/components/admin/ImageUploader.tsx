"use client";

import { useState, useRef } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  folder?: string;
  isSubmitting?: boolean;
}

export default function ImageUploader({ onUploadSuccess, folder = 'images', isSubmitting = false }: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
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

    try {
      const storageRef = ref(storage, `${folder}/${Date.now()}-${file.name}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      toast({ title: "Upload Successful" });
      onUploadSuccess(downloadURL);

    } catch (error: any) {
      console.error("Upload failed:", error);
      let description = "An unknown error occurred during upload.";
      if (error.code) {
        switch(error.code) {
          case 'storage/unauthorized':
            description = "Permission denied. Check your Firebase Storage security rules. They must allow writes for authenticated users.";
            break;
          case 'storage/object-not-found':
             description = "File not found. This can happen if you try to get a URL for a file that failed to upload.";
             break;
          default:
            description = `Upload failed with code: ${error.code}. Check the browser console for more details.`;
        }
      }
      toast({ title: "Upload Failed", description: description, variant: "destructive", duration: 9000 });
    } finally {
      // This block ensures the UI is always reset
      setIsUploading(false);
      setFile(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
              {isUploading ? (
                <Loader2 className={cn("mr-2 h-4 w-4", isUploading && "animate-spin")} />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
        </div>
    </div>
  );
}
