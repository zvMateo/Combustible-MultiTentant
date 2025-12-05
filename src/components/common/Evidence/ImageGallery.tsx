import { useState } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Grid,
  Card,
  CardMedia,
  Typography,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import DownloadIcon from "@mui/icons-material/Download";
import type { Evidencia } from "../../../types/reports";

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
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="text.secondary">
          No hay imágenes para mostrar
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <Grid container spacing={2}>
        {images.map((image, index) => (
          // @ts-expect-error - MUI v7 Grid type incompatibility
          <Grid xs={6} sm={4} md={3} key={image.id}>
            <Card
              elevation={0}
              sx={{
                cursor: "pointer",
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                transition: "all 0.2s",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  transform: "scale(1.02)",
                },
              }}
              onClick={() => handleOpen(index)}
            >
              <Box sx={{ position: "relative" }}>
                <CardMedia
                  component="img"
                  height="150"
                  image={image.url}
                  alt={image.tipo}
                  sx={{
                    objectFit: "cover",
                    backgroundColor: "#f5f5f5",
                  }}
                />
                <Chip
                  label={image.tipo.replace("foto-", "")}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "rgba(255,255,255,0.95)",
                    fontWeight: 600,
                    fontSize: 10,
                    textTransform: "capitalize",
                  }}
                />
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Lightbox Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#000",
            backgroundImage: "none",
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: "relative", bgcolor: "#000" }}>
          {/* Close Button */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              color: "white",
              bgcolor: "rgba(0,0,0,0.5)",
              zIndex: 1,
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.7)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Image Info */}
          <Box
            sx={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 1,
            }}
          >
            <Chip
              label={currentImage?.tipo.replace("foto-", "") || ""}
              sx={{
                bgcolor: "rgba(255,255,255,0.95)",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: "white",
                mt: 1,
                bgcolor: "rgba(0,0,0,0.6)",
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {currentIndex + 1} / {images.length}
            </Typography>
          </Box>

          {/* Zoom Controls */}
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              right: 16,
              display: "flex",
              gap: 1,
              zIndex: 1,
            }}
          >
            <IconButton
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              sx={{
                color: "white",
                bgcolor: "rgba(0,0,0,0.5)",
                "&:hover": {
                  bgcolor: "rgba(0,0,0,0.7)",
                },
                "&:disabled": {
                  color: "rgba(255,255,255,0.3)",
                },
              }}
            >
              <ZoomOutIcon />
            </IconButton>
            <Typography
              sx={{
                color: "white",
                display: "flex",
                alignItems: "center",
                px: 1,
                bgcolor: "rgba(0,0,0,0.5)",
                borderRadius: 1,
                minWidth: 60,
                justifyContent: "center",
              }}
            >
              {Math.round(zoom * 100)}%
            </Typography>
            <IconButton
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              sx={{
                color: "white",
                bgcolor: "rgba(0,0,0,0.5)",
                "&:hover": {
                  bgcolor: "rgba(0,0,0,0.7)",
                },
                "&:disabled": {
                  color: "rgba(255,255,255,0.3)",
                },
              }}
            >
              <ZoomInIcon />
            </IconButton>
            {onDownload && (
              <IconButton
                onClick={handleDownload}
                sx={{
                  color: "white",
                  bgcolor: "rgba(0,0,0,0.5)",
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.7)",
                  },
                }}
              >
                <DownloadIcon />
              </IconButton>
            )}
          </Box>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "white",
                  bgcolor: "rgba(0,0,0,0.5)",
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.7)",
                  },
                }}
              >
                <NavigateBeforeIcon fontSize="large" />
              </IconButton>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "white",
                  bgcolor: "rgba(0,0,0,0.5)",
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.7)",
                  },
                }}
              >
                <NavigateNextIcon fontSize="large" />
              </IconButton>
            </>
          )}

          {/* Image */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "70vh",
              overflow: "auto",
              p: 6,
            }}
          >
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
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

