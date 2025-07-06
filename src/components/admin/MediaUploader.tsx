
"use client";

import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, Copy, Check, Loader2 } from 'lucide-react';

export const MediaUploader = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      setUploadedUrl(null); // Reset previous URL
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload) {
      toast({ title: "No file selected", description: "Please choose a file to upload first.", variant: "destructive" });
      return;
    }
    if (!storage) {
      toast({ title: "Firebase Error", description: "Firebase Storage is not configured.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `images/${Date.now()}_${fileToUpload.name}`);
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setUploadedUrl(downloadURL);
      toast({ title: "Upload Successful", description: "You can now copy the URL below." });
    } catch (error: any) {
        console.error("Image upload failed:", error);
        let errorMessage = "An unexpected error occurred during upload.";
        if (error.code) {
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = "Permission Denied. Check your Firebase Storage security rules to allow uploads and reads.";
              break;
            case 'storage/object-not-found':
               errorMessage = "File not found after upload. This can be a permission issue for getting the URL.";
               break;
          }
        }
        toast({ title: "Upload Failed", description: errorMessage, variant: "destructive" });
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleCopy = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl).then(() => {
        setHasCopied(true);
        toast({ title: "Copied!", description: "Image URL copied to clipboard." });
        setTimeout(() => setHasCopied(false), 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        toast({ title: "Copy Failed", description: "Could not copy URL to clipboard.", variant: "destructive" });
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline">
          <UploadCloud className="mr-3 h-6 w-6 text-primary" /> Media Uploader
        </CardTitle>
        <CardDescription>
          Upload an image here to get a URL. Then, copy and paste that URL into the 'Image URL' field in the forms below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
            <Input 
                id="file-upload-standalone" 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect} 
                accept="image/*"
                className="flex-grow"
            />
            <Button onClick={handleUpload} disabled={isUploading || !fileToUpload} className="w-full sm:w-auto">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
        </div>

        {uploadedUrl && (
            <div className="p-3 border rounded-md bg-muted/40 space-y-2">
                <p className="text-sm font-medium">Upload Complete. Copy URL:</p>
                <div className="flex items-center gap-2">
                    <Input readOnly value={uploadedUrl} className="bg-background text-xs" />
                    <Button size="icon" variant="outline" onClick={handleCopy}>
                        {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
};
