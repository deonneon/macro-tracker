import { ExportFormat } from './ExportService';

export interface FileGenerationOptions {
  format: ExportFormat;
  data: string;
  filename?: string;
}

export const FileGenerationService = {
  /**
   * Generate a file for download
   * @param options File generation options
   * @returns A Blob object with the file data
   */
  generateFile(options: FileGenerationOptions): Blob {
    const mimeTypes = {
      csv: 'text/csv',
      json: 'application/json'
    };
    
    return new Blob([options.data], { type: mimeTypes[options.format] });
  },
  
  /**
   * Generate an appropriate filename
   * @param format The file format
   * @param customName Optional custom base filename
   * @returns A filename with timestamp and appropriate extension
   */
  generateFilename(format: ExportFormat, customName?: string): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    const baseName = customName || 'nutrition_data';
    
    return `${baseName}_${timestamp}.${format}`;
  },
  
  /**
   * Trigger a file download in the browser
   * @param options File generation options
   * @returns Void
   */
  downloadFile(options: FileGenerationOptions): void {
    const blob = this.generateFile(options);
    const filename = options.filename || this.generateFilename(options.format);
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to the document, click to download, then remove
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  }
};

export default FileGenerationService; 