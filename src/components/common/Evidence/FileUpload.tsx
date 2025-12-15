import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Trash2,
  Image,
  AudioLines,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import type { TipoEvidencia } from "@/types/evidencia";

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
  maxSize = 10,
  multiple = true,
  maxFiles = 5,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      const validateFile = (file: File): string | null => {
        if (file.size > maxSize * 1024 * 1024) {
          return `El archivo excede el tamaño máximo de ${maxSize}MB`;
        }
        if (tipo.startsWith("foto") && !file.type.startsWith("image/")) {
          return "Solo se permiten imágenes";
        }
        if (tipo === "audio" && !file.type.startsWith("audio/")) {
          return "Solo se permiten archivos de audio";
        }
        return null;
      };

      setError("");
      const fileArray = Array.from(newFiles);

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

    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending"
          ? ({ ...f, status: "uploading", progress: 0 } as FileWithPreview)
          : f
      )
    );

    try {
      await onUpload(filesToUpload, tipo);
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? ({ ...f, status: "success", progress: 100 } as FileWithPreview)
            : f
        )
      );
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? ({
                ...f,
                status: "error",
                error: err instanceof Error ? err.message : "Error al subir",
              } as FileWithPreview)
            : f
        )
      );
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="size-6" />;
    if (file.type.startsWith("audio/"))
      return <AudioLines className="size-6" />;
    return <Upload className="size-6" />;
  };

  return (
    <div>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/30"
          }
          hover:border-primary/50
        `}
      >
        <Upload
          className={`size-12 mx-auto mb-3 ${
            isDragging ? "text-primary" : "text-muted-foreground"
          }`}
        />
        <p className="text-lg font-semibold mb-1">Arrastra archivos aquí</p>
        <p className="text-sm text-muted-foreground mb-2">
          o haz clic para seleccionar
        </p>
        <p className="text-xs text-muted-foreground">
          {tipo.startsWith("foto") ? "Imágenes" : "Audio"} • Máximo {maxSize}MB
          • Hasta {maxFiles} archivos
        </p>

        <input
          id="file-input"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertCircle className="size-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setError("")}
            >
              <X className="size-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((fileItem, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {/* Preview/Icon */}
                  {fileItem.preview ? (
                    <img
                      src={fileItem.preview}
                      alt=""
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                      {getFileIcon(fileItem.file)}
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    {fileItem.status === "uploading" && (
                      <Progress
                        value={fileItem.progress}
                        className="h-1 mt-2"
                      />
                    )}

                    {fileItem.error && (
                      <p className="text-xs text-destructive mt-1">
                        {fileItem.error}
                      </p>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    {fileItem.status === "success" && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="size-3" />
                        Subido
                      </Badge>
                    )}
                    {fileItem.status === "error" && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="size-3" />
                        Error
                      </Badge>
                    )}
                    {fileItem.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Upload Button */}
          {files.some((f) => f.status === "pending") && (
            <Button className="w-full mt-3" onClick={handleUpload}>
              <Upload className="size-4 mr-2" />
              Subir {files.filter((f) => f.status === "pending").length}{" "}
              {files.filter((f) => f.status === "pending").length === 1
                ? "archivo"
                : "archivos"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
