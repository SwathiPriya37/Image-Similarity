import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadZoneProps {
  label: string;
  onImageSelect: (file: File) => void;
  image: string | null;
}

export const ImageUploadZone = ({ label, onImageSelect, image }: ImageUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  }, [onImageSelect]);

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 
          transition-all duration-200 cursor-pointer
          ${isDragging 
            ? "border-primary bg-upload-bg/50" 
            : "border-upload-border bg-upload-bg"
          }
          hover:border-primary/70 hover:bg-upload-bg/70
          min-h-[240px] flex flex-col items-center justify-center
        `}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id={`file-input-${label}`}
        />
        
        {!image ? (
          <>
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-foreground text-center mb-1 font-medium">
              Drop image here or click to upload
            </p>
            <p className="text-muted-foreground text-sm mb-4">{label}</p>
            <label htmlFor={`file-input-${label}`}>
              <Button variant="secondary" className="cursor-pointer" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </span>
              </Button>
            </label>
          </>
        ) : (
          <div className="relative w-full h-full">
            <img 
              src={image} 
              alt={label}
              className="w-full h-full object-cover rounded-lg"
            />
            <label 
              htmlFor={`file-input-${label}`}
              className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center cursor-pointer"
            >
              <Button variant="secondary" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Change Image
                </span>
              </Button>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
