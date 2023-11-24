import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { s3 } from "@/utils/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env.mjs";
import axios from "axios";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import z from "zod";

export const replicateRouter = createTRPCRouter({
  startTrainingModel: protectedProcedure.mutation(
    async ({ ctx: { prisma, session } }) => {
      const user = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
      });

      if (!user?.isPaymentSucceded) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Payment not done",
        });
      }

      if (user.modelTrainingLimit == 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only one mdoel can be trained from a single account. If you want to tran more, then create another account.",
        });
      }

      let zipDataSignedUrl;
      try {
        zipDataSignedUrl = await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: env.AI_AVATAR_COURSE_BUCKET_NAME,
            Key: `uploads/${session.user.id}/data.zip`,
          }),
          {
            expiresIn: 60 * 60,
          }
        );
      } catch (error) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Error getting the zip file, upload images again",
        });
      }

      const userUniqueKeyword = nanoid(4);

      await prisma.user.update({
        where: {
          id: session.user.id,
        },
        data: {
          uniqueKeyword: userUniqueKeyword,
        },
      });

      try {
        const { data } = await axios.post(
          "https://dreambooth-api-experimental.replicate.com/v1/trainings",
          {
            input: {
              instance_prompt: `a photo of a ${userUniqueKeyword} person`,
              class_prompt: "a photo of a person",
              instance_data: zipDataSignedUrl,
              max_train_steps: 2000,
            },
            model: `raksa1/${session.user.id}`,
            trainer_version:
              "cd3f925f7ab21afaef7d45224790eedbb837eeac40d22e8fefe015489ab644aa",
            webhook_completed: `${env.REPLICATE_TRAINING_FINISHED_WEBHOOK}?userId=${session.user.id}`,
          },
          {
            headers: {
              Authorization: `Token ${env.REPLICATE_TOKEN}`,
            },
          }
        );

        await prisma.user.update({
          where: {
            id: session.user.id,
          },
          data: {
            modelTrainingLimit: {
              decrement: 1,
            },
            modelId: data.id,
          },
        });
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong with model training",
        });
      }
    }
  ),
  checkModelTrainingStatus: protectedProcedure.query(
    async ({ ctx: { prisma, session } }) => {
      const user = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          modelId: true,
        },
      });

      if (!user?.modelId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Model training not started.",
        });
      }

      try {
        const { data } = await axios.get(
          `https://dreambooth-api-experimental.replicate.com/v1/trainings/${user?.modelId}`,
          {
            headers: {
              Authorization: `Token ${env.REPLICATE_TOKEN}`,
            },
          }
        );
        return data.status;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something wrong with replicate",
        });
      }
    }
  ),
  generateAvatars: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(0),
      })
    )
    .mutation(async ({ ctx: { prisma, session }, input: { prompt } }) => {
      const user = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
      });

      if ((user?.credits ?? 0) <= 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "credits are finished",
        });
      }

      if (!user?.trainerVersion) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "model is not trained yet",
        });
      }

      try {
        await axios.post(
          "https://api.replicate.com/v1/predictions",
          {
            input: {
              prompt,
            },
            version: user?.trainerVersion,
            webhook_completed: `${env.REPLICATE_AVATARS_GENERATED_WEBHOOK}?userId=${session.user.id}`,
          },
          {
            headers: {
              Authorization: `Token ${env.REPLICATE_TOKEN}`,
            },
          }
        );
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong with replicate",
        });
      }
    }),
});
