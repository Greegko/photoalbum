import { createComputed, createSignal } from "solid-js";

export interface ImageData {
  name: string;
  path: string;
}

export const usePhotoAlbum = () => {
  const [images, setImages] = createSignal<ImageData[]>([]);
  const [directoryHandle, setDirectoryHandle] = createSignal<FileSystemDirectoryHandle | null>(null);

  const loadImagesFromDirectory = async (handle: FileSystemDirectoryHandle): Promise<ImageData[]> => {
    let imageFiles: ImageData[] = [];
    for await (const entry of handle.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) {
          imageFiles = [...imageFiles, { name: file.name, path: URL.createObjectURL(file) }];
        }
      } else if (entry.kind === "directory") {
        const nestedImages = await loadImagesFromDirectory(entry);
        imageFiles = [...imageFiles, ...nestedImages];
      }
    }
    return imageFiles;
  };

  createComputed(async () => {
    if (!directoryHandle()) return;

    const imageFiles = await loadImagesFromDirectory(directoryHandle()!);
    setImages(imageFiles);
  });

  return { images, setDirectoryHandle };
};
