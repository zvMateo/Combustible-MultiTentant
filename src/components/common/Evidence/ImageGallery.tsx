import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import type { Evidencia } from "@/types/evidencia";

interface ImageGalleryProps {
  images: Evidencia[];
  onDownload?: (image: Evidencia) => void;
  initialIndex?: number;
}

export default function ImageGallery({
  images,
  onDownload,
  initialIndex = 0,
}: ImageGalleryProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const handleOpen = (index: number) => {
    setCurrentIndex(index);
    setZoom(1);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setZoom(1);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    if (onDownload && images[currentIndex]) {
      onDownload(images[currentIndex]);
    }
  };

  const currentImage = images[currentIndex];

  if (images.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No hay imágenes para mostrar</p>
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((image, index) => (
          <div
            key={image.id}
            onClick={() => handleOpen(index)}
            className="relative cursor-pointer rounded-xl overflow-hidden border border-border transition-all hover:shadow-lg hover:scale-[1.02]"
          >
            <img
              src={image.url}
              alt={image.tipo}
              className="w-full h-36 object-cover bg-muted"
            />
            <Badge className="absolute top-2 right-2 text-[10px] capitalize">
              {image.tipo.replace("foto-", "")}
            </Badge>
          </div>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          <div className="relative min-h-[70vh]">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-black/70"
            >
              <X className="size-5" />
            </Button>

            {/* Image Info */}
            <div className="absolute top-4 left-4 z-10">
              <Badge className="capitalize">
                {currentImage?.tipo.replace("foto-", "") || ""}
              </Badge>
              <p className="text-white text-xs mt-2 bg-black/60 px-2 py-1 rounded">
                {currentIndex + 1} / {images.length}
              </p>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="text-white bg-black/50 hover:bg-black/70 disabled:opacity-30"
              >
                <ZoomOut className="size-5" />
              </Button>
              <span className="text-white bg-black/50 px-3 py-2 rounded-md text-sm min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="text-white bg-black/50 hover:bg-black/70 disabled:opacity-30"
              >
                <ZoomIn className="size-5" />
              </Button>
              {onDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="text-white bg-black/50 hover:bg-black/70"
                >
                  <Download className="size-5" />
                </Button>
              )}
            </div>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 h-12 w-12"
                >
                  <ChevronLeft className="size-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 h-12 w-12"
                >
                  <ChevronRight className="size-8" />
                </Button>
              </>
            )}

            {/* Image */}
            <div className="flex justify-center items-center min-h-[70vh] p-12">
              <img
                src={currentImage?.url}
                alt={currentImage?.tipo}
                style={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  transform: `scale(${zoom})`,
                  transition: "transform 0.2s",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
