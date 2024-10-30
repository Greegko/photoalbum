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
          {selectedImage().tags.length > 0 && (
            <div class="flex flex-wrap gap-1 mt-2">
              {selectedImage().tags.map(tag => (
                <div class="bg-blue-500 text-white text-xs px-2 py-1 rounded">{tag}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images().map(image => (
          <div onClick={[setSelectedImage, image]} class="relative cursor-pointer">
            <img src={image.path} alt={image.name} class="w-full h-24 object-cover" />
            {image.tags.length > 0 && (
              <div class="absolute bottom-2 left-2 flex flex-wrap gap-1">
                {image.tags.map(tag => (
                  <div class="bg-blue-500 text-white text-xs px-2 py-1 rounded">{tag}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
