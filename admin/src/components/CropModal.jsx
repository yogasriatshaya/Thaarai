import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

export default function CropModal({ image, onCropComplete, onCancel, aspect = 21/9 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-charcoal">Adjust Image</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Crop and zoom to fit the banner perfectly</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-charcoal transition-colors">&times;</button>
        </div>
        
        <div className="relative h-[400px] bg-gray-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaComplete}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="p-8 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full max-w-xs">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block text-center sm:text-left">Zoom Level</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gold-500"
            />
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={onCancel}
              className="flex-1 sm:flex-none px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 sm:flex-none px-10 py-3 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gold-600 transition-all shadow-lg hover:shadow-gold-500/20"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const getCroppedImg = (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        blob.name = 'cropped.jpg';
        resolve(blob);
      }, 'image/jpeg', 1.0);
    };
    image.onerror = (error) => reject(error);
  });
};
