import { createComputed, createSignal, For, Show } from "solid-js";
import { ImageData, usePhotoAlbum } from "../model/data";
import { useImageDirectoryHandler } from "../model/image-directory-handler";

export const PhotoAlbum = () => {
  const { directoryHandler, requestDirectoryAccess } = useImageDirectoryHandler();
  const { images, setDirectoryHandle, addTagToImage } = usePhotoAlbum();
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

      <Show when={selectedImage()} keyed>
        {selectedImage => (
          <div class="mb-4">
            <img src={selectedImage.path} alt="Selected" class="max-w-full max-h-96" />
            <Show when={selectedImage.metadata.tags.length}>
              <div class="flex flex-wrap gap-1 mt-2">
                {selectedImage.metadata.tags.map(tag => (
                  <Tag text={tag} color="bg-blue-500" />
                ))}
              </div>
            </Show>
            <div class="flex flex-wrap gap-1 mt-2">
              <span onClick={() => addTagToImage(selectedImage.name, "A")}>
                <Tag text="A" color="bg-red-500" />
              </span>
              <span onClick={() => addTagToImage(selectedImage.name, "B")}>
                <Tag text="B" color="bg-red-500" />
              </span>
            </div>
          </div>
        )}
      </Show>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <For each={images()}>
          {image => (
            <div
              onClick={[setSelectedImage, image]}
              class={`relative cursor-pointer ${selectedImage() === image ? "border-4 border-blue-500" : ""}`}
            >
              <img src={image.path} alt={image.name} class="w-full h-24 object-cover" />
              <Show when={image.metadata.tags.length > 0}>
                <div class="absolute bottom-2 left-2 flex flex-wrap gap-1">
                  {image.metadata.tags.map(tag => (
                    <Tag text={tag} />
                  ))}
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

const Tag = (props: { text: string; color: string }) => (
  <div class=" text-white text-xs px-2 py-1 rounded cursor-pointer" classList={{ [props.color]: true }}>
    {props.text}
  </div>
);
