import SignInFlow from "../islands/signin/SignInFlow.tsx";

export default function SignIn(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") ?? "de";

  return <SignInFlow lang={lang} />;
} 