
'use client';

import { useRef, useState, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, FileUp, Loader2, Video, ScanLine } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type ImageUploaderProps = {
  onImageReady: (dataUrl: string) => void;
  isLoading: boolean;
};

export function ImageUploader({ onImageReady, isLoading }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const getDevices = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImageDataUrl(dataUrl);
        onImageReady(dataUrl);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            await getDevices();

            const constraints: MediaStreamConstraints = { 
              video: { 
                deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined 
              } 
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsCameraOn(true);
                setImageDataUrl(null); 
                onImageReady(''); 
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            alert("Could not access the selected camera. Please check permissions and try again.");
        }
    }
  };
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const takePicture = () => {
    if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImageDataUrl(dataUrl);
        onImageReady(dataUrl);
        stopCamera();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isCameraOn) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        takePicture();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        stopCamera();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOn]);


  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader className="p-4">
        <CardTitle className="font-headline text-lg">Image Input</CardTitle>

      </CardHeader>
      <CardContent className="p-0 relative bg-muted/30 flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="sr-only">Extracting data...</span>
          </div>
        )}
        <video ref={videoRef} className={`h-full w-full object-cover ${isCameraOn ? '' : 'hidden'}`} muted playsInline />
        {!isCameraOn && (
            imageDataUrl ? (
              <Image
                src={imageDataUrl}
                alt="Form preview"
                fill
                className="object-contain p-3"
                data-ai-hint="handwritten form"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-center text-muted-foreground p-3">
                <ScanLine className="h-10 w-10 mb-3 animate-pulse text-primary/50" />
                <p className="font-semibold text-base">Ready to Scan</p>

              </div>
            )
        )}
      </CardContent>
      <CardFooter className="p-3 flex flex-col gap-3">
        {!isCameraOn && devices.length > 1 && (
          <div className="w-full space-y-2">
            <Label htmlFor="camera-select" className="text-sm">Select Camera</Label>
            <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
              <SelectTrigger id="camera-select" onClick={getDevices} onFocus={getDevices} className="h-10 py-2 text-sm">
                <Video className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select a camera" />
              </SelectTrigger>
              <SelectContent>
                {devices.map(device => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${devices.indexOf(device) + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 w-full">
          <Input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
          {isCameraOn ? (
              <>
                  <Button onClick={takePicture} disabled={isLoading} className="bg-accent hover:bg-accent/90 h-10 py-2 text-sm">
                      <Camera className="mr-2 h-4 w-4" />
                      Capture (Enter)
                  </Button>
                  <Button onClick={stopCamera} variant="outline" disabled={isLoading} className="h-10 py-2 text-sm">
                      Cancel (Esc)
                  </Button>
              </>
          ) : (
              <>
                  <Button onClick={handleUploadClick} disabled={isLoading} className="h-10 py-2 text-sm">
                      <FileUp className="mr-2 h-4 w-4" />
                      Upload Image
                  </Button>
                  <Button onClick={startCamera} variant="outline" disabled={isLoading} className="h-10 py-2 text-sm">
                      <Camera className="mr-2 h-4 w-4" />
                      Use Camera
                  </Button>
              </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
