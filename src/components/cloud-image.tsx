import { api } from "@/utils/api";
import { X } from "lucide-react";
import React from "react";
import toast from "react-hot-toast";
import { ImSpinner8 } from "react-icons/im";

type CloudImageProps = {
  s3Key: string;
  url: string;
};

const CloudImage = ({ s3Key, url }: CloudImageProps) => {
  const utils = api.useContext();

  const deleteImageFromS3 = api.storage.removeImageFromS3.useMutation({
    onSuccess: () => {
      toast.success("Image delete from cloud");
      utils.storage.getAllUserUploadedImages.invalidate();
    },
  });

  return (
    <div className="relative m-4 h-[256px] w-[256px]">
      {deleteImageFromS3.isLoading && (
        <div className="absolute z-10 inset-0 w-full h-full bg-black/40 flex justify-center items-center">
          <ImSpinner8 className="h-10 w-10 animate-spin text-white"></ImSpinner8>
        </div>
      )}

      <button
        onClick={() => {
          deleteImageFromS3.mutate({
            key: s3Key,
          });
        }}
        className="absolute top-0 right-0 rounded-xl bg-black/40 p-2 text-white"
      >
        <X className="h-5 w-5"></X>
      </button>

      <img src={url} alt={""} className="object-cover w-full h-full"></img>
    </div>
  );
};

export default CloudImage;
