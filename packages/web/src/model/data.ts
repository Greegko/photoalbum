import { createComputed, createSignal, onMount } from "solid-js";

interface ImageData {
  name: string;
  path: string;
}

interface Metadata {
  [key: string]: any;
}

export const usePhotoAlbum = () => {
  const [images, setImages] = createSignal<ImageData[]>([]);
  const [metadata, setMetadata] = createSignal<Metadata | null>(null);
  const [directoryHandle, setDirectoryHandle] = createSignal<FileSystemDirectoryHandle | null>(null);

  createComputed(async () => {
    if (!directoryHandle()) return;

    const imageFiles: ImageData[] = [];
    let metadataFile: Metadata | null = null;

    for await (const entry of directoryHandle()!.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (ext === "json") {
          const text = await file.text();
          metadataFile = JSON.parse(text);
          setMetadata(metadataFile);
        } else if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) {
          imageFiles.push({ name: file.name, path: URL.createObjectURL(file) });
        }
      }
    }

    setImages(imageFiles);
  });

  return { images, metadata, setDirectoryHandle };
};
