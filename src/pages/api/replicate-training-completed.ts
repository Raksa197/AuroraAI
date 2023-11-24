import { prisma } from "@/server/db";
import { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import { env } from "@/env.mjs";

const stripeWebhook = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    console.log(req.body);

    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ message: "userid is not given" });
    }

    if (req.body.status !== "succeeded" || !req.body.version) {
      return res.status(400).json({ message: "Model is not trained" });
    }
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        trainerVersion: req.body.version,
      },
    });

    let transporter = nodemailer.createTransport({
      host: env.EMAIL_SERVER_HOST,
      port: Number(env.EMAIL_SERVER_PORT),
      secure: false,
      auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: env.EMAIL_SERVER_USER,
        pass: env.EMAIL_SERVER_PASSWORD,
      },
    });

    if (user.email) {
      await transporter.sendMail({
        from: '"Raksa Ma from AururaAI 👻" <2021180ma@aupp.edu.kh>', // sender address
        to: user.email, // list of receivers
        subject: "Your AI Model Traning is Finished ✔", // Subject line
        html: `
                
                <h3>Hey, your model is trained! </h3>
                <p>Time to create some stunning AI avatars</p>
                <p>You are given 50 credits. By using one credit you can use one prompt that will generate up to 4 photos.</p>

                <p>You are identified as <strong>${user.uniqueKeyword}</strong>. When using prompt, mention this unique keyword.</p>

                <p>Example of a good prompt of yours: a closeup portrait shot of person <string>${user.uniqueKeyword}</strong> in a
                rugged, outdoor adventure outfit, exuding confidence and strength, centered, photorealistic digital paiting,
                artstation, concept art, utilizing cutting-edge techniques for sharp focus, naturealistic lighting to bring out the
                texture of the materials, highly detailed illustration showcasing the gear and accessories, a bold composition that
                embodies the spirit of advanture, artgerm style.</p>

                <p>Head over tot this URL to start plaing around with prompts: <a href="${env.NEXTAUTH_URL}/status">${env.NEXTAUTH_URL}/status
                </a></p>
                `,
      });
    }

    return res.status(200).send("success");
  }

  // do all the stripe stuff
  else {
    res.setHeader("ALLOW", "POST");
    res.status(405).end(`Method ${req.method} not allowed`);
  }
};

export default stripeWebhook;
