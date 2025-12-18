/**
 * useExcelExport - Hook para exportación de datos a Excel
 * Abstrae la lógica repetida de exportación XLSX
 */
import { useCallback } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface ExportOptions<T> {
  /** Nombre del archivo (sin extensión) */
  fileName: string;
  /** Nombre de la hoja de Excel */
  sheetName?: string;
  /** Función para transformar cada item antes de exportar */
  transform?: (item: T) => Record<string, unknown>;
  /** Mensaje de éxito personalizado */
  successMessage?: string;
}

/**
 * Hook para exportar datos a Excel
 * @example
 * const { exportToExcel, isExporting } = useExcelExport<Driver>();
 *
 * const handleExport = () => {
 *   exportToExcel(drivers, {
 *     fileName: "conductores",
 *     sheetName: "Conductores",
 *     transform: (d) => ({
 *       Nombre: d.name,
 *       Documento: d.document,
 *       Estado: d.active ? "Activo" : "Inactivo"
 *     })
 *   });
 * };
 */
export function useExcelExport<T>() {
  const exportToExcel = useCallback((data: T[], options: ExportOptions<T>) => {
    const {
      fileName,
      sheetName = "Datos",
      transform,
      successMessage = "Archivo exportado correctamente",
    } = options;

    try {
      // Transformar datos si se provee función
      const exportData = transform ? data.map(transform) : data;

      // Crear worksheet y workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Generar nombre de archivo con fecha
      const date = new Date().toISOString().split("T")[0];
      const fullFileName = `${fileName}_${date}.xlsx`;

      // Descargar archivo
      XLSX.writeFile(wb, fullFileName);
      toast.success(successMessage);
    } catch (error) {
      console.error("Error al exportar:", error);
      toast.error("Error al exportar el archivo");
    }
  }, []);

  return { exportToExcel };
}

/**
 * Utilidad para exportación simple sin hook (para uso fuera de componentes)
 */
export function exportToExcel<T>(
  data: T[],
  fileName: string,
  sheetName = "Datos",
  transform?: (item: T) => Record<string, unknown>
): void {
  try {
    const exportData = transform ? data.map(transform) : data;
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `${fileName}_${date}.xlsx`);
    toast.success("Archivo exportado correctamente");
  } catch {
    toast.error("Error al exportar el archivo");
  }
}
