import { z } from "zod";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

import { env } from "@/env.mjs";
import { TRPCClientError } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export const stripeRouter = createTRPCRouter({
  checkout: protectedProcedure.mutation(async () => {
    const productData = await stripe.products.retrieve(env.STRIPE_PRODUCT_ID);

    if (!productData.default_price) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "something went wrong with stripe",
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: productData.default_price.toString(),
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:3000/?success=true`,
      cancel_url: `http://localhost:3000/?canceled=true`,
    });

    return { checkoutUrl: checkoutSession.url };
  }),

  getPaymentStatus: protectedProcedure.query(
    async ({ ctx: { prisma, session } }) => {
      return await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          isPaymentSucceded: true,
        },
      });
    }
  ),
});
