import SignInFlow from "../../islands/signin/SignInFlow.tsx";
import { FreshContext } from "fresh";

export default function SignIn(ctx: FreshContext) {
  const req = ctx.req;
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") ?? "de";

  return <SignInFlow lang={lang} />;
}
