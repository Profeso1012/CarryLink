import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth.api";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const email = searchParams.get("email");
  const otp = searchParams.get("otp");

  useEffect(() => {
    if (email && otp) {
      authApi.verifyEmail(email, otp)
        .then(() => {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        })
        .catch((error: any) => {
          setStatus("error");
          setMessage(error.response?.data?.message || "Verification failed");
        });
    } else {
      setStatus("error");
      setMessage("Invalid verification link");
    }
  }, [email, otp]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-carry-bg p-6">
      <div className="bg-white p-12 rounded-sm shadow-sm border border-carry-light/10 text-center max-w-md w-full space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-carry-light mx-auto" />
            <h2 className="text-xl font-bold text-carry-darker">Verifying your email...</h2>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-carry-darker">Verification Successful</h2>
            <p className="text-gray-500">{message}</p>
            <Button onClick={() => navigate("/")} className="w-full bg-carry-light font-bold h-12">
              Go to Dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-carry-darker">Verification Failed</h2>
            <p className="text-red-500">{message}</p>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full font-bold h-12">
              Back to Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
