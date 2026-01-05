import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LogoUploadProps {
  currentLogoUrl: string;
  onLogoChange: (url: string) => void;
  tokenSymbol?: string;
}

export function LogoUpload({ currentLogoUrl, onLogoChange, tokenSymbol }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload JPG, PNG, WebP, or SVG.");
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 2MB.");
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      // Generate unique filename
      const ext = file.name.split('.').pop();
      const timestamp = Date.now();
      const safeName = (tokenSymbol || 'token').toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `${safeName}-${timestamp}.${ext}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('token-logos')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('token-logos')
        .getPublicUrl(data.path);

      onLogoChange(publicUrl);
      toast.success("Logo uploaded successfully!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload logo");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = async () => {
    if (currentLogoUrl && currentLogoUrl.includes('token-logos')) {
      try {
        // Extract filename from URL
        const urlParts = currentLogoUrl.split('/');
        const filename = urlParts[urlParts.length - 1];
        
        await supabase.storage.from('token-logos').remove([filename]);
      } catch (error) {
        console.error("Failed to delete old logo:", error);
      }
    }
    
    onLogoChange('');
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayUrl = previewUrl || currentLogoUrl;

  return (
    <div className="space-y-3">
      <Label>Token Logo</Label>
      
      {displayUrl ? (
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted">
            <img 
              src={displayUrl} 
              alt="Token logo" 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Replace
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Drop logo here or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, WebP, or SVG (max 2MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Fallback URL input */}
      <div className="pt-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <ImageIcon className="w-3 h-3" />
          <span>Or paste an image URL</span>
        </div>
        <Input
          type="url"
          placeholder="https://example.com/logo.png"
          value={currentLogoUrl.includes('token-logos') ? '' : currentLogoUrl}
          onChange={(e) => {
            setPreviewUrl(null);
            onLogoChange(e.target.value);
          }}
          disabled={isUploading}
        />
      </div>
    </div>
  );
}
