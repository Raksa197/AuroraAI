import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FaGoogle } from "react-icons/fa";

import React, { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { stat } from "fs";
import { ChevronRight } from "lucide-react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { useRouter } from "next/router";

const homepage = () => {
  const { status, data } = useSession();
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  console.log();

  const router = useRouter();

  const checkout = api.stripe.checkout.useMutation({
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) router.push(data.checkoutUrl);
    },
  });

  const paymentStatus = api.stripe.getPaymentStatus.useQuery();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      toast.success(
        "Payment succeeded! You will receive an email confirmation."
      );
    }

    if (query.get("canceled")) {
      toast.error("Payment failed");
    }
  }, []);
  return (
    <div className="flex flex-col w-full h-full justify-center items-center">
      <div className="fixed inset-0 bg-gradient-to-br from-pink-100 via-white to-sky-200 -z-10"></div>
      <div className="container mx-auto">
        <header className="flex w-full justify-between py-4 px-10 bg-transparent mx-auto max-w-screen-xl">
          <div>
            {/* logo */}
            AI AVATAR
          </div>
          <div>
            {/* this is for menu */}

            {status === "authenticated" && (
              <Button onClick={() => signOut()}>Logout</Button>
            )}
          </div>
        </header>

        <div className="m-10 flex flex-col justify-center items-center ">
          <div className="bg-gradient-to-br from-black to-slate-500 bg-clip-text text-transparent via-slate-500  text-6xl text-center font-semibold leading-snug">
            <p>Create your own</p>
            {"  "}
            <p>
              photorealistic <span className="text-[#3290EE]">AI</span> Avatars
            </p>
          </div>
          <div className="my-12 w-full max-w-2xl">
            {status === "unauthenticated" && (
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    className=" w-full rounded-full transition duration-200 active:scale-95 bg-gradient-to-tr
                        from-sky-400 via-lime-300 to-yellow-400 p-2"
                  >
                    <div className="bg-white rounded-full py-2 tracking-widest ">
                      Create your own AI Avatars Now
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Complete authentication</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        setAuthLoading(true);
                        await signIn("email", {
                          email,
                        });
                      } catch {
                        console.error(Error);
                      } finally {
                        setAuthLoading(false);
                      }
                    }}
                    className="flex flex-col space-y-4"
                  >
                    <Input
                      type="{email}"
                      required
                      placeholder="john@doe.com"
                      onChange={(e) => setEmail(e.target.value)}
                      value={email}
                    ></Input>
                    <Button
                      type="submit"
                      className="w-full"
                      variant={"outline"}
                    >
                      Verify your email
                    </Button>
                  </form>

                  <p className="w-full text-center font-bold">OR</p>
                  <Button variant={"outline"} onClick={() => signIn("google")}>
                    <FaGoogle className="mr-2">Sign in with Google</FaGoogle>
                  </Button>
                </DialogContent>
              </Dialog>
            )}

            <div className="relative flex w-full justify-center">
              {status === "authenticated" && (
                <Button
                  className="w-full group"
                  size={"lg"}
                  onClick={() => {
                    paymentStatus.data?.isPaymentSucceded
                      ? router.push("/dashboard")
                      : checkout.mutate();
                  }}
                >
                  {paymentStatus.data?.isPaymentSucceded
                    ? "Go to your dashboard"
                    : "Checkout"}

                  <ChevronRight className="ml-2 group-hover:translate-x-1 transition"></ChevronRight>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default homepage;
