"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, ZoomIn, ZoomOut, Move, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleImage {
  vehicle_image_id: number;
  vehicle_id: number;
  img_extension: string;
}

interface ImageCarouselProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: number;
  images: VehicleImage[];
  loading?: boolean;
}

export function ImageCarousel({ open, onOpenChange, vehicleId, images, loading }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, images.length]);

  // Reset zoom when changing images
  useEffect(() => {
    setIsZoomed(false);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }, [currentIndex]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleZoom = () => {
    if (isZoomed) {
      setIsZoomed(false);
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    } else {
      setIsZoomed(true);
      setZoomLevel(2);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isZoomed) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isZoomed) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((prev) => Math.max(1, Math.min(5, prev + delta)));
  };

  const getImageUrl = (image: VehicleImage) => {
    return `http://13.203.1.159:1310/data-files/vehicles/${vehicleId}/${image.vehicle_image_id}.${image.img_extension}`;
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Vehicle Images</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">Loading images...</div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-muted-foreground">No images available</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Main Image Display */}
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <div
                  ref={imageRef}
                  className={cn(
                    "relative w-full h-96 cursor-grab",
                    isDragging && "cursor-grabbing"
                  )}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                >
                  <Image
                    src={getImageUrl(images[currentIndex])}
                    alt={`Vehicle image ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                    style={{
                      transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                      transition: isDragging ? 'none' : 'transform 0.2s ease',
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/assets/logo.jpg') {
                        target.src = '/assets/logo.jpg';
                      }
                    }}
                  />
                  
                  {/* Zoom indicator */}
                  {isZoomed && (
                    <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                      {Math.round(zoomLevel * 100)}%
                    </div>
                  )}
                </div>

                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                      onClick={goToPrevious}
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                      onClick={goToNext}
                    >
                      →
                    </Button>
                  </>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2">
                {images.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePlayPause}
                    className="flex items-center gap-2"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleZoom}
                  className="flex items-center gap-2"
                >
                  {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                  {isZoomed ? "Zoom Out" : "Zoom In"}
                </Button>

                {isZoomed && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Move className="h-4 w-4" />
                    Drag to pan
                  </div>
                )}
              </div>

              {/* Thumbnail Navigation */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={image.vehicle_image_id}
                      onClick={() => goToImage(index)}
                      className={cn(
                        "flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden",
                        index === currentIndex
                          ? "border-primary"
                          : "border-muted hover:border-muted-foreground"
                      )}
                    >
                      <Image
                        src={getImageUrl(image)}
                        alt={`Thumbnail ${index + 1}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/assets/logo.jpg') {
                            target.src = '/assets/logo.jpg';
                          }
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Image counter */}
              <div className="text-center text-sm text-muted-foreground">
                {currentIndex + 1} of {images.length}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
