import { open } from "@tauri-apps/plugin-dialog";

export async function pickFile(filters?: { name: string; extensions: string[] }[]): Promise<string | null> {
  const result = await open({
    multiple: false,
    filters: filters ?? [{ name: "All Files", extensions: ["*"] }],
  });
  if (typeof result === "string") return result;
  return null;
}

export async function pickImageFile(): Promise<string | null> {
  return pickFile([{ name: "Images", extensions: ["png", "jpg", "jpeg", "ico", "svg", "webp"] }]);
}
