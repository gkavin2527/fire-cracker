"use client";

import { useState, useRef } from 'react';
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
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    
    if (!storage) {
        toast({ title: "Firebase Error", description: "Firebase Storage is not configured. Cannot upload.", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    
    try {
      // 1. Create a reference for the new file.
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      
      // 2. Upload the file.
      const snapshot = await uploadBytes(storageRef, file);
      
      // 3. Get the public download URL.
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 4. Notify the parent form. This will update the input field.
      onUploadComplete(downloadURL);
      
      toast({ title: "Upload Successful", description: "Image URL has been populated below." });

    } catch (error: any) {
      console.error("Image upload failed:", error);
      let errorMessage = "An unexpected error occurred during upload.";
      if (error.code) {
        switch (error.code) {
          case 'storage/unauthorized':
            errorMessage = "Permission Denied. Check your Firebase Storage security rules to allow uploads and reads.";
            break;
          case 'storage/canceled':
            errorMessage = "Upload was canceled.";
            break;
        }
      }
      toast({ title: "Upload Failed", description: errorMessage, variant: "destructive" });
    } finally {
      // 5. This guarantees the UI resets every time.
      setIsUploading(false);
      if(fileInputRef.current) {
          fileInputRef.current.value = ""; // Clear the file input so the same file can be re-selected
      }
    }
  };

  return (
    <div className="space-y-2 p-3 border rounded-md bg-muted/20">
      <div className="flex items-center gap-2">
         {/* This input is hidden, but triggered by the button click */}
         <Input 
          id="file-upload" 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
          disabled={isUploading} 
        />
        {/* This button looks like the file input but gives us more control */}
        <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} type="button" className="w-full">
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {isUploading ? 'Uploading...' : 'Choose a file to upload'}
        </Button>
      </div>
    </div>
  );
};
