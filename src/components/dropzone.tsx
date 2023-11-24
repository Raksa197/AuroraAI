import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { nanoid } from "nanoid";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { api } from "@/utils/api";
import axios from "axios";
import { toast } from "react-hot-toast";
import ImageBlobReducer from "image-blob-reduce";
import { object } from "zod";
//@ts-ignore
import Pica from "pica";

const pica = Pica({ features: ["js", "wasm", "cib"] });

const ImageReducer = new ImageBlobReducer({
  pica,
});

type FILE_WITH_PREVIEW = File & { preview: string; id: string };

const Dropzone = () => {
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [files, setFiles] = useState<FILE_WITH_PREVIEW[]>([]);

  const getAllUserUploadedImages =
    api.storage.getAllUserUploadedImages.useQuery();

  const triggerProcessingImages =
    api.images.startProcessingImages.useMutation();

  const utils = api.useContext();

  const getUploadUrls = api.storage.getUploadUrls.useMutation({
    onSuccess: async (data) => {
      try {
        setIsUploadingImages(true);

        const resizedImages: Blob[] = [];

        for (const photo of files) {
          const resizedBlob = await ImageReducer.toBlob(
            new Blob([photo], {
              type: "image/jpeg",
            }),
            { max: 1000 }
          );
          resizedImages.push(resizedBlob);
        }

        const uploadPromises = data.map((uploadUrl, i) => {
          return axios.put(uploadUrl, resizedImages[i]);
        });

        await Promise.all(uploadPromises);
        utils.storage.getAllUserUploadedImages.invalidate();

        triggerProcessingImages.mutate();
      } catch (error) {
        toast.error("Uploading images failed");
      } finally {
        setIsUploadingImages(false);
      }
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/png": [".png"],
      "image/jpg": [".jpg"],
      "image/jpeg": [".jpeg"],
    },
    onDrop: (acceptedFiles) => {
      const allSelectedFiles = [
        ...acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
            id: nanoid(),
          })
        ),
        ...files,
      ];

      const canUploadNow =
        getAllUserUploadedImages.data?.uploadedImagesWithKeys.length;

      allSelectedFiles.splice(10 - (canUploadNow ?? 0));

      setFiles(allSelectedFiles);
    },
    maxFiles: 10,
  });

  useEffect(() => {
    // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, []);

  return (
    <>
      <section className="w-full h-full p-10 flex-col space-y-4  mx-auto">
        <div
          {...getRootProps()}
          className="rounded-xl border-dashed flex items-center justify-center border border-black p-10 bg-slate-200 hover:bg-black/10"
        >
          <input {...getInputProps()} className="w-full h-full " />
          <p className="text-gray-400">
            Drag 'n' drop 3 to 10 images here, or click to select files
          </p>
        </div>
        <div className="flex flex-wrap justify-center items-center  ">
          {files &&
            files.length > 0 &&
            files.map((file) => (
              <div key={file.id} className="h-[256px] w-[256px] m-4 relative">
                <button
                  onClick={() => {
                    setFiles((pre) => pre.filter((img) => img.id !== file.id));
                  }}
                  className="absolute top-0 right-0 bg- bg-black/30 rounded-xl p-2 text-white"
                >
                  <X className="w-5 h-5"></X>
                </button>

                <img
                  src={file.preview}
                  alt={file.name}
                  className="object-cover w-full h-full"
                ></img>
              </div>
            ))}
        </div>
      </section>

      <div className="sticky bottom-0 w-full  h-full p-10 bg-white/70 flex justify-center items-center">
        <div>
          <Button
            disabled={isUploadingImages}
            onClick={() => {
              getUploadUrls.mutate({
                images: files.map((file) => ({ imageId: file.id })),
              });
            }}
          >
            {isUploadingImages ? "Loading..." : "Upload Images"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default Dropzone;
