import Settings from "../islands/settings/Settings.tsx";
import { UserProfile } from "../islands/UserProfile.tsx";

export default function SettingsPage() {
  return (
    <div class="max-h-screen overflow-y-auto">
      <div class="container mx-auto py-8 px-4 max-w-5xl">

      <h1 class="text-3xl font-bold mb-6">Settings</h1>
      <div class="bg-white rounded-lg shadow-lg p-6">
        <UserProfile lang="en" />
        <Settings lang="en" />
      </div>
      </div>
    </div>
  );
} 