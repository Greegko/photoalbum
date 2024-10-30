import { createComputed, createSignal } from "solid-js";

export interface ImageData {
  name: string;
  path: string;
  tags: string[];
}

export const usePhotoAlbum = () => {
  const [images, setImages] = createSignal<ImageData[]>([]);
  const [directoryHandle, setDirectoryHandle] = createSignal<FileSystemDirectoryHandle | null>(null);

  const loadMetadata = async (handle: FileSystemDirectoryHandle): Promise<{ [key: string]: { tags: string[] } }> => {
    for await (const entry of handle.values()) {
      if (entry.kind === "file" && entry.name === "metadata.json") {
        const file = await entry.getFile();
        const text = await file.text();
        return JSON.parse(text);
      }
    }
    return {};
  };

  const loadImagesFromDirectory = async (
    handle: FileSystemDirectoryHandle,
    metadata: { [key: string]: { tags: string[] } },
  ): Promise<ImageData[]> => {
    let imageFiles: ImageData[] = [];
    for await (const entry of handle.values()) {
      if (entry.kind === "file" && entry.name !== "metadata.json") {
        const file = await entry.getFile();
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) {
          const tags = metadata[file.name]?.tags || [];
          imageFiles = [...imageFiles, { name: file.name, path: URL.createObjectURL(file), tags }];
        }
      } else if (entry.kind === "directory") {
        const nestedImages = await loadImagesFromDirectory(entry, metadata);
        imageFiles = [...imageFiles, ...nestedImages];
      }
    }
    return imageFiles;
  };

  createComputed(async () => {
    if (!directoryHandle()) return;

    const metadata = await loadMetadata(directoryHandle()!);
    const imageFiles = await loadImagesFromDirectory(directoryHandle()!, metadata);
    setImages(imageFiles);
  });

  return { images, setDirectoryHandle };
};
