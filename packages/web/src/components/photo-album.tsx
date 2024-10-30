import { createComputed } from "solid-js";
import { usePhotoAlbum } from "../model/data";
import { useImageDirectoryHandler } from "../model/image-directory-handler";

export const PhotoAlbum = () => {
  const { directoryHandler, requestDirectoryAccess } = useImageDirectoryHandler();
  const { images, metadata, setDirectoryHandle } = usePhotoAlbum();

  createComputed(() => {
    if (directoryHandler() !== null) {
      setDirectoryHandle(directoryHandler());
    }
  });

  const onSelectFolder = () => requestDirectoryAccess();

  return (
    <div>
      <span onClick={onSelectFolder}>Select Folder</span>
      Length: {images().length}
      {images().map(image => (
        <div>
          <img src={image.path} alt={image.name} />
          <p>{image.name}</p>
        </div>
      ))}
    </div>
  );
};
