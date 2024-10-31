import { first } from "remeda";
import { For, Show, createComputed, createSelector, createSignal, onMount } from "solid-js";

import { useImageDirectoryHandler } from "../model/image-directory-handler";
import { Image, usePhotoAlbum } from "../model/photo-album";

export const PhotoAlbum = () => {
  const { directoryHandler, requestDirectoryAccess } = useImageDirectoryHandler();
  const { images, setRootDirectoryHandle, addTagToImage, removeTagFromImage, tags } = usePhotoAlbum();
  const [selectedImages, setSelectedImages] = createSignal<Image[] | null>([]);

  const [filters, setFilters] = createSignal<string[]>([]);

  const toggleTagFilter = (tag: string) => {
    setFilters(tags => (tags.includes(tag) ? tags.filter(x => x !== tag) : [...tags, tag]));
  };

  const filteredImages = () => {
    if (filters().length === 0) return images();

    return images().filter(x => filters().every(tag => x.metadata.tags.includes(tag)));
  };

  createComputed(() => {
    if (directoryHandler() !== null) {
      setRootDirectoryHandle(directoryHandler());
    }
  });

  const onImageSelect = (image: Image, event: MouseEvent) => {
    if (event.shiftKey) {
      setSelectedImages(images => (images.includes(image) ? images.filter(x => x !== image) : [...images, image]));
    } else {
      setSelectedImages([image]);
    }
  };

  onMount(() => {
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImages([]);
      }
    });
  });

  const displayImage = () => first(selectedImages());

  const isImageSelected = createSelector<Image[], Image>(
    () => selectedImages(),
    (x, y) => y.includes(x),
  );

  return (
    <div class="w-[800px] m-auto">
      <div onClick={requestDirectoryAccess} class="mb-4">
        Select Root Folder
      </div>

      <div>
        <For each={tags()}>
          {tag => (
            <span onClick={[toggleTagFilter, tag]}>
              <Tag text={tag} color="bg-blue-500" />
            </span>
          )}
        </For>
      </div>

      <DisplayImage image={displayImage()} tags={tags()} addTagToImage={addTagToImage} removeTagFromImage={removeTagFromImage} />

      <div class="grid grid-cols-2 md:grid-cols-7 gap-4">
        <For each={filteredImages()}>
          {image => (
            <div
              onClick={[onImageSelect, image]}
              class="relative cursor-pointer"
              classList={{ "border-4 border-blue-500": isImageSelected(image) }}
            >
              <img src={image.url} alt={image.name} class="w-full h-24 object-cover" />
              <Show when={image.metadata.tags.length > 0}>
                <div class="absolute bottom-2 left-2 flex flex-wrap gap-1">
                  <For each={image.metadata.tags}>{tag => <Tag text={tag} color="bg-blue-500" />}</For>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

interface DisplayImageProps {
  image: Image;
  tags: string[];
  removeTagFromImage: (image: Image, tag: string) => void;
  addTagToImage: (image: Image, tag: string) => void;
}

const DisplayImage = (props: DisplayImageProps) => {
  const toggleTagOnImage = (image: Image, tag: string) => {
    if (image.metadata.tags.includes(tag)) {
      props.removeTagFromImage(image, tag);
    } else {
      props.addTagToImage(image, tag);
    }
  };

  const addNewTag = () => {
    const tag = prompt("Tag Name");
    if (tag) {
      props.addTagToImage(props.image, tag);
    }
  };

  return (
    <Show when={props.image} keyed>
      {displayImage => (
        <div class="mb-4">
          <img src={displayImage.url} alt="Selected" class="max-w-full max-h-96" />
          <div class="flex flex-wrap gap-1 mt-2">
            <For each={props.tags}>
              {tag => (
                <span onClick={() => toggleTagOnImage(displayImage, tag)}>
                  <Tag text={tag} color={props.image.metadata.tags.includes(tag) ? "bg-red-500" : "bg-blue-500"} />
                </span>
              )}
            </For>

            <span onClick={addNewTag}>
              <Tag text={"+ Add Tag"} color={"bg-blue-500"} />
            </span>
          </div>
        </div>
      )}
    </Show>
  );
};

const Tag = (props: { text: string; color: string }) => (
  <span class="text-white text-xs px-2 py-1 rounded cursor-pointer" classList={{ [props.color]: true }}>
    {props.text}
  </span>
);
