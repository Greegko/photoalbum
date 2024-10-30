import { createComputed, createSignal } from "solid-js";

export interface ImageData {
  name: string;
  path: string;
  metadata: { tags: string[] };
}

export interface Metadata {
  [key: string]: { tags: string[] };
}

export const usePhotoAlbum = () => {
  const [images, setImages] = createSignal<ImageData[]>([]);
  const [directoryHandle, setDirectoryHandle] = createSignal<FileSystemDirectoryHandle | null>(null);

  const loadMetadata = async (handle: FileSystemDirectoryHandle): Promise<Metadata> => {
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
    metadata: Metadata,
  ): Promise<ImageData[]> => {
    let imageFiles: ImageData[] = [];
    for await (const entry of handle.values()) {
      if (entry.kind === "file" && entry.name !== "metadata.json") {
        const file = await entry.getFile();
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) {
          const imageMetadata = metadata[file.name] || { tags: [] };
          imageFiles = [...imageFiles, { name: file.name, path: URL.createObjectURL(file), metadata: imageMetadata }];
        }
      } else if (entry.kind === "directory") {
        const nestedImages = await loadImagesFromDirectory(entry, metadata);
        imageFiles = [...imageFiles, ...nestedImages];
      }
    }
    return imageFiles;
  };

  const saveMetadata = async (handle: FileSystemDirectoryHandle, metadata: Metadata) => {
    const fileHandle = await handle.getFileHandle("metadata.json", { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(metadata));
    await writable.close();
  };

  const addTagToImage = async (image: ImageData, tag: string) => {
    const currentImages = images();
    const imageIndex = currentImages.findIndex(i => i === image);
    if (imageIndex !== -1) {
      const updatedImage = {
        ...currentImages[imageIndex],
        metadata: { ...currentImages[imageIndex].metadata, tags: [...currentImages[imageIndex].metadata.tags, tag] },
      };
      const updatedImages = [
        ...currentImages.slice(0, imageIndex),
        updatedImage,
        ...currentImages.slice(imageIndex + 1),
      ];
      setImages(updatedImages);
      const metadata: Metadata = updatedImages.reduce((acc, image) => {
        acc[image.name] = { tags: image.metadata.tags };
        return acc;
      }, {} as Metadata);
      if (directoryHandle()) {
        await saveMetadata(directoryHandle()!, metadata);
      }
    }
  };

  const removeTagFromImage = async (image: ImageData, tag: string) => {
    const currentImages = images();
    const imageIndex = currentImages.findIndex(i => i === image);
    if (imageIndex !== -1) {
      const updatedTags = currentImages[imageIndex].metadata.tags.filter(t => t !== tag);
      const updatedImage = {
        ...currentImages[imageIndex],
        metadata: { ...currentImages[imageIndex].metadata, tags: updatedTags },
      };
      const updatedImages = [
        ...currentImages.slice(0, imageIndex),
        updatedImage,
        ...currentImages.slice(imageIndex + 1),
      ];
      setImages(updatedImages);
      const metadata: Metadata = updatedImages.reduce((acc, image) => {
        acc[image.name] = { tags: image.metadata.tags };
        return acc;
      }, {} as Metadata);
      if (directoryHandle()) {
        await saveMetadata(directoryHandle()!, metadata);
      }
    }
  };

  createComputed(async () => {
    if (!directoryHandle()) return;

    const metadata = await loadMetadata(directoryHandle()!);
    const imageFiles = await loadImagesFromDirectory(directoryHandle()!, metadata);
    setImages(imageFiles);
  });

  return { images, setDirectoryHandle, addTagToImage, removeTagFromImage };
};
