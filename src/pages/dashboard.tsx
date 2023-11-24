import React, { useState } from "react";
import Layout from "@/components/layout";
import { api } from "@/utils/api";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { ImSpinner8 } from "react-icons/im";
import Dropzone from "@/components/dropzone";
import { Files, X } from "lucide-react";
import { fileURLToPath } from "url";
import { Button } from "@/components/ui/button";
import CloudImage from "@/components/cloud-image";

const Dashboard = () => {
  const router = useRouter();

  const [uploadMoreImages, setUploadMoreImages] = useState(false);

  const checkModelTrainingStatus =
    api.replicate.checkModelTrainingStatus.useQuery(undefined, {
      onSuccess: (data) => {
        if (data) {
          toast(
            "Model trained already started, redirecting you to generate avatars page"
          );
          router.push("/generate-avatars");
        }
      },
    });

  const startTrainingModel = api.replicate.startTrainingModel.useMutation({
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Model start training successfully");
      router.push("/generate-avatars");
    },
  });

  const getAllUserUploadedImages =
    api.storage.getAllUserUploadedImages.useQuery();

  const paymentStatus = api.stripe.getPaymentStatus.useQuery(undefined, {
    onError: (err) => {
      if (err.data?.httpStatus === 401) {
        router.push("/");
        toast.error("Please login first");
      }
    },
    onSuccess: (data) => {
      if (!data?.isPaymentSucceded) {
        toast.error("Please complete the payment first");
        router.push("/");
      }
    },
  });

  if (
    paymentStatus.isLoading ||
    !paymentStatus.data?.isPaymentSucceded ||
    getAllUserUploadedImages.isLoading
  ) {
    return (
      <Layout>
        <div className="h-[80vh] w-full flex justify-center items-center">
          <ImSpinner8 className="w-10 h-10 animate-spin "></ImSpinner8>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {getAllUserUploadedImages.data?.uploadedImagesWithKeys && (
        <>
          <div className="flex flex-wrap justify-center items-center  ">
            {getAllUserUploadedImages.isSuccess &&
              getAllUserUploadedImages.data?.uploadedImagesWithKeys.map(
                (imageObj) =>
                  imageObj?.key &&
                  imageObj?.url && (
                    <CloudImage
                      key={imageObj.key}
                      s3Key={imageObj.key}
                      url={imageObj.url}
                    ></CloudImage>
                  )
              )}
          </div>
          <div className=" w-full space-x-4  p-10 bg-white/30 flex justify-center items-center">
            <div>
              <Button
                onClick={() => setUploadMoreImages(true)}
                disabled={startTrainingModel.isLoading}
              >
                Upload More
              </Button>
            </div>

            <div>
              <Button
                onClick={() => {
                  startTrainingModel.mutate();
                }}
                disabled={startTrainingModel.isLoading}
              >
                Start Training Your Model
              </Button>
            </div>
          </div>{" "}
        </>
      )}

      {(getAllUserUploadedImages.data?.uploadedImagesWithKeys.length === 0 ||
        uploadMoreImages) && <Dropzone></Dropzone>}
    </Layout>
  );
};

export default Dashboard;
