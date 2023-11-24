import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";

const GenerateAvatars = () => {
  const checkModelTrainingStatus =
    api.replicate.checkModelTrainingStatus.useQuery();

  const userData = api.user.fetchUserDetails.useQuery(undefined, {
    refetchInterval: 15 * 1000,
  });

  const generateAvatars = api.replicate.generateAvatars.useMutation({
    onSuccess: () => {
      toast.success("Your avatars will be generated in 2 to 4 minutes");
      setPrompt("");
    },
    onError: (err) => {
      toast.error(err.message.slice(0, 150));
    },
  });

  const [prompt, setPrompt] = useState("");

  return (
    <Layout>
      <div className="flex flex-col space-y-6 h-full w-full items-center justify-center">
        {checkModelTrainingStatus.isLoading && userData.isLoading && (
          <div className="rounded-xl bg-black/30 p-4">
            <Loader2 className="h-10 w-10 text-white animate-spin"></Loader2>
          </div>
        )}

        {checkModelTrainingStatus.data && (
          <div className="text-3xl font-semibold">
            Model Status:{" "}
            <span
              className={cn(
                checkModelTrainingStatus.data === "succeeded" &&
                  "text-green-500",
                "capitalize"
              )}
            >
              {checkModelTrainingStatus.data}
            </span>
          </div>
        )}

        {userData.isSuccess && (
          <div className="flex w-full h-full flex-col  justify-center items-center">
            <div className="text-xl">
              You have{" "}
              <span className="font-bold">{userData.data?.credits}</span>{" "}
              credits remaining!
            </div>

            <div className="text-lg">
              Your unique keyword is{" "}
              <span className="font-bold ">
                {userData?.data?.uniqueKeyword}
              </span>
            </div>
          </div>
        )}

        {checkModelTrainingStatus.isSuccess &&
          checkModelTrainingStatus.data === "succeeded" && (
            <div className="w-full flex justify-center items-center 4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log(prompt);
                  generateAvatars.mutate({
                    prompt,
                  });
                }}
                className="w-full max-w-lg shadow-md flex flex-col "
              >
                <div>
                  <p className="text-gray-700 text-xm">Prompt Demo</p>
                  <p className="text-gray-700 text-sm">
                    a closeup portrait shot of person{" "}
                    {userData.data?.uniqueKeyword ?? "xyz"} in a rugged, outdoor
                    adventure outfit, exuding confidence and strength, centered,
                    photorealistic digital paiting, artstation, concept art,
                    utilizing cutting-edge techniques for sharp focus,
                    naturealistic lighting to bring out the texture of the
                    materials, highly detailed illustration showcasing the gear
                    and accessories, a bold composition that embodies the spirit
                    of advanture, artgerm style.
                  </p>
                </div>

                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-36 "
                  placeholder={`a closeup portrait shot of person ${
                    userData.data?.uniqueKeyword ?? "xyz"
                  } in a rugged, outdoor adventure outfit, exuding confidence and strength, centered, photorealistic digital paiting, artstation, concept art, utilizing cutting-edge techniques for sharp focus, naturealistic lighting to bring out the texture of the materials, highly detailed illustration showcasing the gear and  accessories, a bold composition that embodies the spirit of advanture, artgerm style.
                    `}
                ></Textarea>

                <Button disabled={generateAvatars.isLoading} type="submit">
                  Generate Avatars
                </Button>
              </form>
            </div>
          )}

        {userData.isSuccess && userData.data?.images && (
          <div>
            <div className="flex flex-wrap justify-center items-center  ">
              {userData.data?.images.map((image) => (
                <div
                  key={image.id}
                  className="h-[256px] w-[256px] m-4 relative"
                >
                  <img
                    src={image.imageUrl}
                    alt={""}
                    className="object-cover w-full h-full"
                  ></img>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GenerateAvatars;
