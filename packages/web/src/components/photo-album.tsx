import { filter, first } from "remeda";
import { For, Show, createComputed, createSelector, createSignal, onMount } from "solid-js";

import { useImageDirectoryHandler } from "../model/image-directory-handler";
import { Image, usePhotoAlbum } from "../model/photo-album";

const NoTags = Symbol("No-Tags");
type NoTags = typeof NoTags;

export const PhotoAlbum = () => {
  const { directoryHandler, requestDirectoryAccess } = useImageDirectoryHandler();
  const { images, setRootDirectoryHandle, addTagToImage, removeTagFromImage, tags } = usePhotoAlbum();
  const [selectedImages, setSelectedImages] = createSignal<Image[] | null>([]);

  const [filters, setFilters] = createSignal<string[] | NoTags>([]);

  const toggleTagFilter = (tag: string | NoTags) => {
    if (tag === NoTags) return setFilters(tags => (tags === NoTags ? [] : NoTags));

    setFilters(tags => (tags !== NoTags && tags.includes(tag) ? tags.filter(x => x !== tag) : tags === NoTags ? [tag] : [...tags, tag]));
  };

  const filteredImages = () => {
    const tags = filters();
    if (tags === NoTags) return images().filter(image => image.metadata.tags.length === 0);
    if (tags.length === 0) return images();

    return images().filter(x => tags.every(tag => x.metadata.tags.includes(tag)));
  };

  const isTagFilterSelected = (tag: string | NoTags) => {
    const tags = filters();

    if (tags === NoTags) return tag === NoTags;
    if (tag === NoTags) return false;

    return tags.includes(tag);
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

  const addTagToImageHandler = (tag: string) => {
    selectedImages().map(x => addTagToImage(x, tag));
  };

  const removeTagFromImageHandler = (tag: string) => {
    selectedImages().map(x => removeTagFromImage(x, tag));
  };

  const isImageSelected = createSelector<Image[], Image>(
    () => selectedImages(),
    (x, y) => y.includes(x),
  );

  return (
    <div class="w-[800px] m-auto">
      <div onClick={requestDirectoryAccess} class="mb-4">
        Select Root Folder
      </div>
      <div class="flex flex-wrap gap-1 mt-2 mb-2">
        Tags:
        <span onClick={[toggleTagFilter, NoTags]}>
          <Tag text="Without Tags" color={isTagFilterSelected(NoTags) ? "bg-red-500" : "bg-blue-500"} />
        </span>
        <For each={tags()}>
          {tag => (
            <span onClick={[toggleTagFilter, tag]}>
              <Tag text={tag} color={isTagFilterSelected(tag) ? "bg-red-500" : "bg-blue-500"} />
            </span>
          )}
        </For>
      </div>
      <DisplayImage
        image={displayImage()}
        tags={tags()}
        addTagToImage={addTagToImageHandler}
        removeTagFromImage={removeTagFromImageHandler}
      />
      <div class="grid grid-cols-2 md:grid-cols-7 gap-4">
        <For each={filteredImages()}>
          {image => (
            <div
              onClick={[onImageSelect, image]}
              class="relative cursor-pointer"
              classList={{ "border-4 border-blue-500": isImageSelected(image) }}
            >
              <img src={image.url} alt={image.name} class="w-full h-24 object-cover" />
              <div class="absolute bottom-2 left-2 flex flex-wrap gap-1">
                <Show when={image.metadata.tags.length > 0}>
                  <For each={image.metadata.tags}>{tag => <Tag text={tag} color="bg-blue-500" />}</For>
                </Show>
                <Show when={image.folder}>
                  <Tag text={image.folder} color="bg-green-500" />
                </Show>
              </div>
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
  removeTagFromImage: (tag: string) => void;
  addTagToImage: (tag: string) => void;
}

const DisplayImage = (props: DisplayImageProps) => {
  const toggleTagOnImage = (image: Image, tag: string) => {
    if (image.metadata.tags.includes(tag)) {
      props.removeTagFromImage(tag);
    } else {
      props.addTagToImage(tag);
    }
  };

  const addNewTag = () => {
    const tag = prompt("Tag Name");

    if (tag) {
      props.addTagToImage(tag);
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

            <Show when={displayImage.folder}>
              <span>
                <Tag text={displayImage.folder} color="bg-green-500" />
              </span>
            </Show>

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
