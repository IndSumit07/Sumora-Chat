import Navbar from "@/components/layout/Navbar";
import AccountSettings from "@/components/settings/AccountSettings";

export default function SettingsPage() {
  return (
    <main style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh" }}>
      <Navbar />
      <AccountSettings />
    </main>
  );
}
