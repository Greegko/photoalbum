import { last, unique } from "remeda";
import { batch, createComputed, createMemo, createSignal, untrack } from "solid-js";

export interface Image {
  name: string;
  url: string;
  path: string;
  folder: string;
  lastModifiedDate: Date;
  metadata: ImageMetadata;
}

interface ImageMetadata {
  tags: string[];
}

type MetadataFile = { [imagePath: string]: ImageMetadata };

export const usePhotoAlbum = () => {
  const [files, setFiles] = createSignal<Image[]>([]);
  const [metadata, setMetadata] = createSignal<MetadataFile>({});
  const [rootDirectoryHandle, setRootDirectoryHandle] = createSignal<FileSystemDirectoryHandle | null>(null);

  const images = createMemo(() => {
    const allFiles = files();
    const allMetadata = metadata();

    return allFiles.map(image => {
      return { ...image, metadata: { ...image.metadata, ...allMetadata[image.path] } };
    });
  });

  const tags = createMemo(() => unique(images().flatMap(x => x.metadata.tags)));

  const loadMetadata = async (handle: FileSystemDirectoryHandle): Promise<MetadataFile> => {
    try {
      const fileHandler = await handle.getFileHandle("metadata.json");
      const file = await fileHandler.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch {
      return {};
    }
  };

  async function* loadImagesFromDirectory(handle: FileSystemDirectoryHandle, path: string[]): AsyncGenerator<Image, void, void> {
    for await (const entry of handle.values()) {
      if (entry.kind === "file" && entry.name !== "metadata.json") {
        const file = await entry.getFile();
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) {
          yield {
            name: file.name,
            url: URL.createObjectURL(file),
            folder: path.join("/"),
            lastModifiedDate: new Date(file.lastModified),
            path: (path.length > 0 ? path.join("/") + "/" : "") + file.name,
            metadata: { tags: [] },
          };
        }
      } else if (entry.kind === "directory") {
        yield* loadImagesFromDirectory(entry, [...path, entry.name]);
      }
    }
  }

  createComputed(async () => {
    const rootDir = untrack(() => rootDirectoryHandle());
    const data = metadata();

    if (!rootDir) return;

    const fileHandle = await rootDir.getFileHandle("metadata.json", { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data));
    await writable.close();
  });

  createComputed(() => {
    const meta = metadata();
    const file = files();

    if (file.length === 0) return;

    batch(() => {
      for (let fileMetadataPath in meta) {
        const fileRef = file.find(x => x.path === fileMetadataPath);

        if (!fileRef) {
          const metaFileName = last(fileMetadataPath.split("/"));
          const filesWithSameName = file.filter(x => x.name === metaFileName);

          if (filesWithSameName.length === 1) {
            const newFile = last(filesWithSameName);
            const newMetadata = { ...meta };
            newMetadata[newFile.path] = newMetadata[fileMetadataPath];
            delete newMetadata[fileMetadataPath];
            setMetadata(newMetadata);
          } else {
            console.warn("Missing file metadata correction - multiple file has been found", filesWithSameName);
          }
        }
      }
    });
  });

  const addTagToImage = async (image: Image, tag: string) => {
    setMetadata(metadataFile => ({
      ...metadataFile,
      [image.path]: { ...image.metadata, tags: [...image.metadata.tags, tag] },
    }));
  };

  const removeTagFromImage = async (image: Image, tag: string) => {
    setMetadata(metadataFile => ({
      ...metadataFile,
      [image.path]: { ...image.metadata, tags: image.metadata.tags.filter(tagName => tagName !== tag) },
    }));
  };

  createComputed(async () => {
    const root = rootDirectoryHandle();
    if (!root) return;

    const metadata = await loadMetadata(root);
    setMetadata(metadata);

    const imageFiles = await collectAsyncGeneratorValues(loadImagesFromDirectory(root, []));
    setFiles(imageFiles);
  });

  return { images, setRootDirectoryHandle, addTagToImage, removeTagFromImage, tags };
};

async function collectAsyncGeneratorValues<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const results = [];
  for await (const value of gen) {
    results.push(value);
  }
  return results;
}
