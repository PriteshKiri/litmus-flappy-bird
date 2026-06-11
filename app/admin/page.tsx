import AdminClient from "@/components/AdminClient";

export const metadata = {
  title: "Admin · Chaos Bird",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
