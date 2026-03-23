"use client";

import { useState } from "react";
import type { FolderColor } from "@/types/library";
import type { useFolders } from "./useFolders";
import type { useLibrary } from "./useLibrary";

type FolderHook = ReturnType<typeof useFolders>;
type LibHook = ReturnType<typeof useLibrary>;

export function useFolderOperations(folderHook: FolderHook, lib: LibHook) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderModalParentId, setFolderModalParentId] = useState<
    string | undefined
  >(undefined);
  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);

  function handleCreateFolder(parentId?: string) {
    setFolderModalParentId(parentId);
    setShowFolderModal(true);
  }

  async function handleConfirmFolder(name: string, color: FolderColor | null) {
    setShowFolderModal(false);
    try {
      const id = await folderHook.createFolder(name, folderModalParentId);
      if (color) await folderHook.setFolderColor(id, color);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function handleRenameFolder(id: string) {
    const folder = folderHook.folders.find((f) => f.id === id);
    if (!folder) return;
    setRenameFolderId(id);
  }

  async function handleConfirmRenameFolder(name: string) {
    if (!renameFolderId) return;
    await folderHook.renameFolder(renameFolderId, name);
    setRenameFolderId(null);
  }

  async function handleDeleteFolder(id: string) {
    const folder = folderHook.folders.find((f) => f.id === id);
    if (!folder) return;
    const confirmed = window.confirm(
      `Delete folder "${folder.name}"? All diagrams inside will be moved to root.`,
    );
    if (!confirmed) return;
    await folderHook.deleteFolder(id);
    if (lib.state.activeSection === `folder:${id}`) {
      lib.setSection("all");
    }
  }

  return {
    showFolderModal,
    folderModalParentId,
    renameFolderId,
    handleCreateFolder,
    handleConfirmFolder,
    handleRenameFolder,
    handleConfirmRenameFolder,
    handleDeleteFolder,
    closeFolderModal: () => setShowFolderModal(false),
    closeRenameModal: () => setRenameFolderId(null),
  };
}
