import TestsListIsland from "./(_islands)/TestsListIsland.tsx";

export default function TestsListPage(ctx: FreshContext) {
  const req = ctx.req;
  const url = new URL(req.url);
  let lang = (url.searchParams.get("lang") as string) !== undefined &&
      url.searchParams.get("lang") !== null
    ? url.searchParams.get("lang")
    : "de";

  if (lang === null) {
    lang = "de";
  }

  return (
    <>
      <head>
        <title>Tests | School Bud-E</title>
      </head>
      <TestsListIsland lang={lang} />
    </>
  );
}
