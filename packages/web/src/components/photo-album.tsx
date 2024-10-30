import { createComputed, createSignal } from "solid-js";
import { ImageData, usePhotoAlbum } from "../model/data";
import { useImageDirectoryHandler } from "../model/image-directory-handler";

export const PhotoAlbum = () => {
  const { directoryHandler, requestDirectoryAccess } = useImageDirectoryHandler();
  const { images, setDirectoryHandle } = usePhotoAlbum();
  const [selectedImage, setSelectedImage] = createSignal<ImageData | null>(null);

  createComputed(() => {
    if (directoryHandler() !== null) {
      setDirectoryHandle(directoryHandler());
    }
  });

  const onSelectFolder = () => requestDirectoryAccess();

  return (
    <div class="flex flex-col items-center">
      <div onClick={onSelectFolder} class="mb-4">
        Select Folder
      </div>

      {selectedImage() && (
        <div class="mb-4">
          <img src={selectedImage().path} alt="Selected" class="max-w-full max-h-96" />
        </div>
      )}

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images().map(image => (
          <div onClick={[setSelectedImage, image]}>
            <img src={image.path} alt={image.name} class="w-full h-24 object-cover" />
            <p class="text-center mt-2">{image.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
