import { cookies } from "next/headers";
import { jsonOk } from "@/lib/api-utils";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  return jsonOk({ message: "Logged out" });
}
