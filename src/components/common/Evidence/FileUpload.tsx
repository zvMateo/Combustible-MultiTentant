import { useState, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import ImageIcon from "@mui/icons-material/Image";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import type { TipoEvidencia } from "../../../types/reports";

interface FileUploadProps {
  onUpload: (files: File[], tipo: TipoEvidencia) => Promise<void>;
  tipo: TipoEvidencia;
  accept?: string;
  maxSize?: number; // en MB
  multiple?: boolean;
  maxFiles?: number;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

export default function FileUpload({
  onUpload,
  tipo,
  accept = tipo.startsWith("foto") ? "image/*" : "audio/*",
  maxSize = 10, // 10MB por defecto
  multiple = true,
  maxFiles = 5,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");

  const validateFile = (file: File): string | null => {
    // Validar tamaño
    if (file.size > maxSize * 1024 * 1024) {
      return `El archivo excede el tamaño máximo de ${maxSize}MB`;
    }

    // Validar tipo
    if (tipo.startsWith("foto") && !file.type.startsWith("image/")) {
      return "Solo se permiten imágenes";
    }
    if (tipo === "audio" && !file.type.startsWith("audio/")) {
      return "Solo se permiten archivos de audio";
    }

    return null;
  };

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      setError("");
      const fileArray = Array.from(newFiles);

      // Validar cantidad
      if (files.length + fileArray.length > maxFiles) {
        setError(`Máximo ${maxFiles} archivos permitidos`);
        return;
      }

      const validFiles: FileWithPreview[] = [];

      fileArray.forEach((file) => {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }

        const fileWithPreview: FileWithPreview = {
          file,
          status: "pending",
          progress: 0,
        };

        // Crear preview para imágenes
        if (file.type.startsWith("image/")) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }

        validFiles.push(fileWithPreview);
      });

      setFiles((prev) => [...prev, ...validFiles]);
    },
    [files.length, maxFiles, maxSize, tipo]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      // Revocar URL de preview
      if (newFiles[index]?.preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    const filesToUpload = files
      .filter((f) => f.status === "pending")
      .map((f) => f.file);

    if (filesToUpload.length === 0) return;

    // Actualizar estado a uploading
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "uploading", progress: 0 } as FileWithPreview : f
      )
    );

    try {
      await onUpload(filesToUpload, tipo);

      // Actualizar a success
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading" ? { ...f, status: "success", progress: 100 } as FileWithPreview : f
        )
      );
    } catch (err) {
      // Actualizar a error
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? {
                ...f,
                status: "error",
                error: err instanceof Error ? err.message : "Error al subir",
              } as FileWithPreview
            : f
        )
      );
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon />;
    }
    if (file.type.startsWith("audio/")) {
      return <AudioFileIcon />;
    }
    return <CloudUploadIcon />;
  };

  return (
    <Box>
      {/* Drop Zone */}
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: isDragging
            ? "2px dashed #1E2C56"
            : "2px dashed #e0e0e0",
          borderRadius: 2,
          p: 4,
          textAlign: "center",
          bgcolor: isDragging ? "#1E2C5608" : "#f8f9fa",
          transition: "all 0.2s",
          cursor: "pointer",
        }}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <CloudUploadIcon
          sx={{
            fontSize: 48,
            color: isDragging ? "#1E2C56" : "#999",
            mb: 2,
          }}
        />
        <Typography variant="h6" gutterBottom>
          Arrastra archivos aquí
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          o haz clic para seleccionar
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {tipo.startsWith("foto") ? "Imágenes" : "Audio"} • Máximo {maxSize}MB
          • Hasta {maxFiles} archivos
        </Typography>

        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          style={{ display: "none" }}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          {files.map((fileItem, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                mb: 2,
                border: "1px solid #e0e0e0",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  {/* Preview/Icon */}
                  {fileItem.preview ? (
                    <Box
                      component="img"
                      src={fileItem.preview}
                      sx={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 1,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        bgcolor: "#f5f5f5",
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                      }}
                    >
                      {getFileIcon(fileItem.file)}
                    </Box>
                  )}

                  {/* File Info */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {fileItem.file.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>

                    {/* Progress Bar */}
                    {fileItem.status === "uploading" && (
                      <LinearProgress
                        variant="determinate"
                        value={fileItem.progress}
                        sx={{ mt: 1 }}
                      />
                    )}

                    {/* Error Message */}
                    {fileItem.error && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        {fileItem.error}
                      </Typography>
                    )}
                  </Box>

                  {/* Status & Actions */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {fileItem.status === "success" && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Subido"
                        size="small"
                        color="success"
                      />
                    )}
                    {fileItem.status === "error" && (
                      <Chip
                        icon={<ErrorIcon />}
                        label="Error"
                        size="small"
                        color="error"
                      />
                    )}
                    {fileItem.status === "pending" && (
                      <IconButton
                        size="small"
                        onClick={() => removeFile(index)}
                        sx={{ color: "#ef4444" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}

          {/* Upload Button */}
          {files.some((f) => f.status === "pending") && (
            <Button
              variant="contained"
              fullWidth
              onClick={handleUpload}
              startIcon={<CloudUploadIcon />}
              sx={{
                mt: 2,
                bgcolor: "#1E2C56",
                "&:hover": {
                  bgcolor: "#16213E",
                },
              }}
            >
              Subir {files.filter((f) => f.status === "pending").length}{" "}
              {files.filter((f) => f.status === "pending").length === 1
                ? "archivo"
                : "archivos"}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

