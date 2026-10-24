import React, { useEffect, useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import { useDropzone } from "react-dropzone";

interface DropzoneProps {
  setBeforeFile: React.Dispatch<React.SetStateAction<File | null>>;
  setAfterFile: React.Dispatch<React.SetStateAction<File | null>>;
  beforeImageUrl?: string | null;
  afterImageUrl?: string | null;
}

const DropzoneComponent: React.FC<DropzoneProps> = ({
  setBeforeFile,
  setAfterFile,
  beforeImageUrl,
  afterImageUrl,
}) => {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);

  useEffect(() => {
    if (beforeImageUrl) {
      setBeforeImage(beforeImageUrl);
    }
  }, [beforeImageUrl]);

  useEffect(() => {
    if (afterImageUrl) {
      setAfterImage(afterImageUrl);
    }
  }, [afterImageUrl]);

  const onDropBefore = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      setBeforeFile(file);
      setBeforeImage(URL.createObjectURL(file));
    }
  };

  const onDropAfter = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      setAfterFile(file);
      setAfterImage(URL.createObjectURL(file));
    }
  };

  const beforeDropzone = useDropzone({
    onDrop: onDropBefore,
    multiple: false,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
    },
  });

  const afterDropzone = useDropzone({
    onDrop: onDropAfter,
    multiple: false,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
    },
  });
console.log(beforeImage)
console.log(afterImage)
  return (
    <div className="space-y-6">
      {/* BEFORE IMAGE */}
      <ComponentCard title="Image Before Goal">
        {!beforeImage ? (
          <div
            {...beforeDropzone.getRootProps()}
            className="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center"
          >
            <input {...beforeDropzone.getInputProps()} />
            <h4>Drag & Drop Before Image</h4>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <img
              src={beforeImage}
              alt="Before"
              className="h-64 w-64 rounded-lg border object-cover"
            />

            <button
              type="button"
              onClick={() => {
                setBeforeImage(null);
                setBeforeFile(null);
              }}
              className="rounded bg-red-500 px-4 py-2 text-white"
            >
              Remove Image
            </button>
          </div>
        )}
      </ComponentCard>

      {/* AFTER IMAGE */}
      <ComponentCard title="Image After Goal">
        {!afterImage ? (
          <div
            {...afterDropzone.getRootProps()}
            className="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center"
          >
            <input {...afterDropzone.getInputProps()} />
            <h4>Drag & Drop After Image</h4>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <img
              src={afterImage}
              alt="After"
              className="h-64 w-64 rounded-lg border object-cover"
            />

            <button
              type="button"
              onClick={() => {
                setAfterImage(null);
                setAfterFile(null);
              }}
              className="rounded bg-red-500 px-4 py-2 text-white"
            >
              Remove Image
            </button>
          </div>
        )}
      </ComponentCard>
    </div>
  );
};

export default DropzoneComponent;