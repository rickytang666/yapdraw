"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useLibrary } from "@/hooks/library/useLibrary";
import { useFolders } from "@/hooks/library/useFolders";
import { useFolderOperations } from "@/hooks/library/useFolderOperations";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useUserSettings } from "@/hooks/useUserSettings";
import { migrateFromLocalStorage } from "@/lib/io/migrate";
import { importExcalidrawFile } from "@/lib/io/import";
import { db } from "@/lib/db";
import { createDiagram } from "@/lib/diagram";
import type { DiagramType, FolderColor } from "@/types/library";
import Sidebar from "./Sidebar";
import LibraryHeader from "./LibraryHeader";
import LibraryContent from "./LibraryContent";
import SettingsPanel from "@/components/editor/SettingsPanel";
import NewDiagramModal from "./NewDiagramModal";
import NewFolderModal from "./NewFolderModal";
import RenameFolderModal from "./RenameFolderModal";
import BulkActionBar from "./BulkActionBar";

export default function LibraryView() {
  const router = useRouter();
  const lib = useLibrary();
  const folderHook = useFolders();
  const { settings, setSettings } = useUserSettings();
  const folderOps = useFolderOperations(folderHook, lib);

  const [showNewModal, setShowNewModal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [overFolderId, setOverFolderId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    migrateFromLocalStorage();
    lib.purgeExpiredTrash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useKeyboardShortcuts({
    "/": () => {
      searchRef.current?.focus();
      searchRef.current?.select();
    },
    "mod+k": () => {
      searchRef.current?.focus();
      searchRef.current?.select();
    },
    "mod+n": () => {
      if (!isTrash) setShowNewModal(true);
    },
    escape: () => {
      lib.clearSelection();
    },
  });

  const isTrash = lib.state.activeSection === "trash";

  async function handleCreateDiagram(name: string, diagramType: DiagramType) {
    setShowNewModal(false);
    const folderId = lib.state.activeSection.startsWith("folder:")
      ? lib.state.activeSection.slice(7)
      : null;
    const diagram = createDiagram({ name, folderId, diagramType });
    await db.diagrams.add(diagram);
    router.push(`/d/${diagram.id}`);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const newId = await importExcalidrawFile(file);
      router.push(`/d/${newId}`);
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to import file. Make sure it is a valid .excalidraw file.");
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    setOverFolderId(
      over && typeof over.id === "string" && over.id.startsWith("folder:")
        ? over.id.slice(7)
        : null,
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    setOverFolderId(null);
    const { active, over } = event;
    if (!over) return;
    const overId = over.id as string;
    if (overId.startsWith("folder:")) {
      await lib.moveDiagram(active.id as string, overId.slice(7));
    }
  }

  function sectionLabel(): string {
    switch (lib.state.activeSection) {
      case "all":
        return "All Diagrams";
      case "starred":
        return "Starred";
      case "trash":
        return "Trash";
      default:
        if (lib.state.activeSection.startsWith("folder:")) {
          const folder = folderHook.folders.find(
            (f) => f.id === lib.state.activeSection.slice(7),
          );
          return folder?.name || "Folder";
        }
        return "Library";
    }
  }

  const selectedIds = lib.state.selectedIds;

  return (
    <DndContext
      sensors={sensors}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {settingsOpen && (
          <SettingsPanel
            settings={settings}
            onSave={setSettings}
            onClose={() => setSettingsOpen(false)}
          />
        )}
        {showNewModal && (
          <NewDiagramModal
            onConfirm={handleCreateDiagram}
            onCancel={() => setShowNewModal(false)}
          />
        )}
        {folderOps.showFolderModal && (
          <NewFolderModal
            parentName={
              folderOps.folderModalParentId
                ? folderHook.folders.find(
                    (f) => f.id === folderOps.folderModalParentId,
                  )?.name
                : undefined
            }
            onConfirm={(name: string, color: FolderColor | null) =>
              folderOps.handleConfirmFolder(name, color)
            }
            onCancel={folderOps.closeFolderModal}
          />
        )}
        {folderOps.renameFolderId && (
          <RenameFolderModal
            folder={{
              id: folderOps.renameFolderId,
              name:
                folderHook.folders.find(
                  (f) => f.id === folderOps.renameFolderId,
                )?.name || "Folder",
            }}
            onConfirm={folderOps.handleConfirmRenameFolder}
            onCancel={folderOps.closeRenameModal}
          />
        )}

        <input
          ref={importInputRef}
          type="file"
          accept=".excalidraw"
          className="hidden"
          onChange={handleImportFile}
        />

        <Sidebar
          activeSection={lib.state.activeSection}
          trashedCount={lib.trashedCount}
          onSection={lib.setSection}
          folders={folderHook.tree}
          overFolderId={overFolderId}
          onCreateFolder={() => folderOps.handleCreateFolder()}
          onRenameFolder={folderOps.handleRenameFolder}
          onDeleteFolder={folderOps.handleDeleteFolder}
          onAddSubfolder={(parentId) => folderOps.handleCreateFolder(parentId)}
        />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <LibraryHeader
            sectionLabel={sectionLabel()}
            isTrash={isTrash}
            searchQuery={lib.state.searchQuery}
            onSearch={lib.setSearch}
            searchRef={searchRef}
            sortField={lib.state.sortField}
            sortDirection={lib.state.sortDirection}
            onSort={lib.setSort}
            viewMode={lib.state.viewMode}
            onViewMode={lib.setViewMode}
            onImport={() => importInputRef.current?.click()}
            settings={settings}
            onOpenSettings={() => setSettingsOpen(true)}
            onNewDiagram={() => setShowNewModal(true)}
          />
          <LibraryContent
            isTrash={isTrash}
            diagrams={lib.diagrams}
            folders={lib.folders}
            selectedIds={selectedIds}
            viewMode={lib.state.viewMode}
            searchQuery={lib.state.searchQuery}
            activeSection={lib.state.activeSection}
            trashedCount={lib.trashedCount}
            folderTree={folderHook.tree}
            onToggleSelect={lib.toggleSelect}
            onStar={lib.starDiagram}
            onTrash={lib.trashDiagram}
            onDuplicate={lib.duplicateDiagram}
            onRename={lib.renameDiagram}
            onMove={lib.moveDiagram}
            onRestore={lib.restoreDiagram}
            onDelete={lib.permanentlyDelete}
            onEmptyTrash={lib.emptyTrash}
            onSetSection={lib.setSection}
            onCreateDiagram={() => setShowNewModal(true)}
          />
        </div>

        {selectedIds.size > 0 && (
          <BulkActionBar
            selectedCount={selectedIds.size}
            folders={lib.folders}
            diagrams={lib.diagrams}
            selectedIds={selectedIds}
            onStar={() => lib.bulkStar(Array.from(selectedIds), true)}
            onUnstar={() => lib.bulkStar(Array.from(selectedIds), false)}
            onMove={(folderId) =>
              lib.bulkMove(Array.from(selectedIds), folderId)
            }
            onTrash={() => lib.bulkTrash(Array.from(selectedIds))}
            onClear={lib.clearSelection}
          />
        )}
      </div>
    </DndContext>
  );
}
