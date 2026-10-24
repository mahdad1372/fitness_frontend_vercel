import React, { useEffect, useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import { useDropzone } from "react-dropzone";

interface DropzoneProps {
  setBeforeFile: React.Dispatch<React.SetStateAction<File | null>>;
  setAfterFile: React.Dispatch<React.SetStateAction<File | null>>;
  beforeImageUrl?: string | null;
}

const DropzoneComponent: React.FC<DropzoneProps> = ({
  setBeforeFile,
  setAfterFile,
  beforeImageUrl,
}) => {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (beforeImageUrl) {
      setPreview(beforeImageUrl);
    }
  }, [beforeImageUrl]);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setBeforeFile(file);   // set before
      setAfterFile(file);    // set after with same image
      setPreview(URL.createObjectURL(file));
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/webp": [],
      "image/svg+xml": [],
    },
  });

  return (
    <ComponentCard title="Coach Image">
      {!preview ? (
        <div
          {...getRootProps()}
          className="cursor-pointer rounded-xl border-2 border-dashed p-8 text-center"
        >
          <input {...getInputProps()} />
          <h4>Drag & Drop Coach Image</h4>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <img
            src={preview}
            alt="Goal"
            className="h-64 w-64 rounded-lg border object-cover"
          />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              setBeforeFile(null);
              setAfterFile(null);
            }}
            className="rounded bg-red-500 px-4 py-2 text-white"
          >
            Remove Image
          </button>
        </div>
      )}
    </ComponentCard>
  );
};

export default DropzoneComponent;