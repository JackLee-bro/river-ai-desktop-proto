"use client";

import { useState } from "react";

type StationImage = {
  id: string;
  label: string;
  url?: string;
};

type StationImageGalleryProps = {
  images: StationImage[];
};

export default function StationImageGallery({ images }: StationImageGalleryProps) {
  const [activeImage, setActiveImage] = useState<StationImage | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => image.url && setActiveImage(image)}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left"
          >
            {image.url ? (
              <img
                src={image.url}
                alt={image.label}
                className="h-32 w-full object-cover"
              />
            ) : (
              <div className="flex h-32 items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-white text-sm font-semibold text-slate-500">
                IMAGE {index + 1}
              </div>
            )}
            <div className="px-3 py-2 text-sm font-semibold text-slate-700">
              {image.label}
            </div>
          </button>
        ))}
      </div>

      {activeImage ? (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/70 p-4"
          onClick={() => {
            setActiveImage(null);
            setIsZoomed(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-slate-700">
                {activeImage.label}
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveImage(null);
                  setIsZoomed(false);
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                닫기
              </button>
            </div>
            {activeImage.url ? (
              <div className="max-h-[80vh] w-full overflow-auto bg-black/5">
                <img
                  src={activeImage.url}
                  alt={activeImage.label}
                  onClick={() => setIsZoomed((prev) => !prev)}
                  className={
                    isZoomed
                      ? "h-auto w-full cursor-zoom-out select-none object-contain transition-transform"
                      : "h-auto w-full cursor-zoom-in select-none object-contain transition-transform"
                  }
                  style={isZoomed ? { transform: "scale(1.6)" } : undefined}
                />
              </div>
            ) : (
              <div className="flex h-[60vh] items-center justify-center text-sm text-slate-500">
                이미지를 표시할 수 없습니다.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
