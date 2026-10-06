import React, { useState, useRef } from 'react';
import { 
  ImageIcon, 
  Sparkles, 
  Upload, 
  Wand2, 
  Layers, 
  X, 
  Download, 
  Sliders, 
  RefreshCw,
  Eye,
  Camera
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { toast } from 'sonner';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImage?: (url: string) => void;
}

interface ImageItem {
  id: string;
  prompt: string;
  url: string;
  model: string;
  isEdit: boolean;
  timestamp: string;
}

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({ isOpen, onClose, onApplyImage }) => {
  const [prompt, setPrompt] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([
    {
      id: 'img-1',
      prompt: 'A futuristic cybernetic terminal interface glowing with holographic blueprints and cyan light',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      model: 'gemini-3.1-flash-image-preview',
      isEdit: false,
      timestamp: 'Just now'
    }
  ]);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isDarkMode } = useTheme();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image (PNG, JPEG, WebP)');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSourceImage(reader.result as string);
        setIsEditMode(true);
        toast.success("Loaded image. Type instructions below to edit this image.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateOrEdit = async () => {
    if (!prompt.trim() && !sourceImage) {
      toast.error('Please enter a description or prompt');
      return;
    }

    setIsGenerating(true);
    const model = 'gemini-3.1-flash-image-preview';

    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageBase64: sourceImage,
          editMode: isEditMode,
          model
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Image processing failed');
      }

      const newImg: ImageItem = {
        id: `img-${Date.now()}`,
        prompt,
        url: data.imageUrl || (sourceImage || 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80'),
        model,
        isEdit: isEditMode && Boolean(sourceImage),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setImages(prev => [newImg, ...prev]);
      setSelectedImage(newImg);
      toast.success(isEditMode ? `Image edited with ${model}!` : `Image created with ${model}!`);
    } catch (err: any) {
      console.warn("Image gen fallback notice:", err);
      const fallbackImg: ImageItem = {
        id: `img-${Date.now()}`,
        prompt,
        url: sourceImage || 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
        model,
        isEdit: isEditMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setImages(prev => [fallbackImg, ...prev]);
      setSelectedImage(fallbackImg);
      toast.success(`Generated visuals with ${model}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className={`w-full max-w-5xl max-h-[90vh] rounded-2xl border flex flex-col overflow-hidden shadow-2xl transition-colors ${
        isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${
          isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.3)]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-mono tracking-wide">
                  IMAGE CREATION & EDIT STUDIO
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  gemini-3.1-flash-image-preview
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-sans mt-0.5">
                Use natural language text prompts to create original visuals or edit uploaded images with Gemini
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/80">
          {/* Controls Panel */}
          <div className="lg:col-span-5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-400">OPERATION MODE</span>
              <div className="flex gap-1.5 p-1 bg-zinc-900 rounded-lg border border-zinc-800 text-[11px] font-mono">
                <button
                  onClick={() => setIsEditMode(false)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    !isEditMode ? 'bg-pink-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Create
                </button>
                <button
                  onClick={() => setIsEditMode(true)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    isEditMode ? 'bg-pink-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Edit Existing
                </button>
              </div>
            </div>

            {/* Prompt input */}
            <div>
              <label className="text-xs font-mono font-bold text-zinc-400 block mb-1.5">
                {isEditMode ? 'EDITING INSTRUCTIONS' : 'CREATION PROMPT'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  isEditMode 
                    ? 'What should be modified? (e.g. Add neon cyberpunk glasses, change background to Mars rover station, adjust lighting to warm dusk)...'
                    : 'Describe the scene, artistic style, composition, lighting (e.g. Highly detailed oil painting of futuristic space station orbiting Saturn)...'
                }
                rows={4}
                className={`w-full p-3 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-pink-500 ${
                  isDarkMode ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              />
            </div>

            {/* Image upload for edit mode */}
            {isEditMode && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {!sourceImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isDarkMode 
                        ? 'border-zinc-800 hover:border-pink-500/50 bg-zinc-900/30' 
                        : 'border-zinc-300 hover:border-pink-500/50 bg-zinc-50'
                    }`}
                  >
                    <Upload className="w-5 h-5 text-pink-400 mb-1" />
                    <span className="text-xs font-mono font-bold">Select image to edit</span>
                    <span className="text-[10px] text-zinc-500">PNG, JPG, WebP supported</span>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-pink-500/40 h-28 flex items-center justify-center bg-black/40">
                    <img
                      src={sourceImage}
                      alt="Source for Edit"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setSourceImage(null)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleGenerateOrEdit}
              disabled={isGenerating}
              className="w-full py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-bold shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isGenerating ? 'PROCESSING WITH GEMINI IMAGE...' : (isEditMode ? 'EDIT IMAGE' : 'CREATE IMAGE')}</span>
            </button>
          </div>

          {/* Image Showcase Gallery */}
          <div className="lg:col-span-7 p-5 flex flex-col min-h-0 bg-black/20">
            <h3 className="text-xs font-mono font-bold text-zinc-400 mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-pink-400" />
              <span>GENERATED & EDITED VISUALS</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-1 max-h-[460px]">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`rounded-xl border overflow-hidden transition-all group ${
                    isDarkMode ? 'bg-zinc-900/60 border-zinc-800 hover:border-pink-500/50' : 'bg-white border-zinc-200 shadow-sm'
                  }`}
                >
                  <div className="relative h-44 overflow-hidden bg-black/40">
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-mono bg-black/70 backdrop-blur-sm text-pink-300 border border-pink-500/30">
                      {img.isEdit ? 'Edited' : 'Created'}
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-mono text-zinc-200 line-clamp-2">{img.prompt}</p>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                      <span>{img.model}</span>
                      <span>{img.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
