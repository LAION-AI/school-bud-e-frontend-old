import Settings from "../islands/settings/Settings.tsx";

export default function SettingsPage(req: Request) {
  const url = new URL(req.url);
  let lang =
    (url.searchParams.get("lang") as string) !== undefined &&
    url.searchParams.get("lang") !== null
      ? url.searchParams.get("lang")
      : "de";

  if (lang === null) {
    lang = "de";
  }

  return (
    <div class="max-h-screen overflow-y-auto">
      <div class="container mx-auto py-8 px-4 max-w-5xl">
        <h1 class="text-3xl font-bold mb-6">Settings</h1>
        <div class="bg-white rounded-lg shadow-lg p-6">
          <Settings lang={lang} />
        </div>
      </div>
    </div>
  );
}
