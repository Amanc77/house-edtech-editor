import Link from "next/link";
import { FileText } from "lucide-react";
import { RegisterForm } from "@/components/features/auth/RegisterForm";
import { APP_NAME } from "@/constants";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <FileText className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">{APP_NAME}</span>
      </Link>
      <RegisterForm />
    </div>
  );
}
