import { Suspense } from "react";
import Link from "next/link";
import { FileText, Loader2 } from "lucide-react";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { APP_NAME } from "@/constants";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <FileText className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">{APP_NAME}</span>
      </Link>
      <Suspense
        fallback={
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
