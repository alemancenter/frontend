export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simple layout without the auth split-screen wrapper
  return <>{children}</>;
}
