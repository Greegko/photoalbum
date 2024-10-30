import { get, set } from "idb-keyval";
import { createSignal, onMount } from "solid-js";

export const useImageDirectoryHandler = () => {
  const [directoryHandler, setDirectoryHandler] = createSignal<FileSystemDirectoryHandle | null>(null);

  const saveToIndexedDB = async (handler: FileSystemDirectoryHandle) => {
    await set("directoryHandler", handler);
  };

  const loadFromIndexedDB = async () => {
    const serializedHandler = await get("directoryHandler");
    if (serializedHandler) {
      setDirectoryHandler(serializedHandler);
    }
  };

  const requestDirectoryAccess = async () => {
    try {
      const handler = await window.showDirectoryPicker();
      setDirectoryHandler(handler);
      await saveToIndexedDB(handler);
    } catch (error) {
      console.error("Directory access was denied", error);
    }
  };

  loadFromIndexedDB();

  return { directoryHandler, requestDirectoryAccess };
};
