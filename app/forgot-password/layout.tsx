import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Forgot Password - BMS Capital",
    description: "Reset your password for BMS Capital Solutions",
};

export default function ForgotPasswordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
