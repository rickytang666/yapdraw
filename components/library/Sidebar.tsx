"use client";

import Image from "next/image";
import Link from "next/link";
import {
  IconLayoutGrid,
  IconStar,
IconTrash,
  IconFolderPlus,
} from "@tabler/icons-react";
import type { SidebarSection } from "@/types/library";
import type { FolderNode } from "@/hooks/useFolders";
import FolderTree from "./FolderTree";

interface Props {
  activeSection: SidebarSection;
  trashedCount: number;
  onSection: (section: SidebarSection) => void;
  folders: FolderNode[];
  overFolderId: string | null;
  onCreateFolder: () => void;
  onRenameFolder: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onAddSubfolder: (parentId: string) => void;
}

const FIXED_SECTIONS: {
  id: SidebarSection;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "all", label: "All Diagrams", icon: <IconLayoutGrid size={16} /> },
  { id: "starred", label: "Starred", icon: <IconStar size={16} /> },
  { id: "trash", label: "Trash", icon: <IconTrash size={16} /> },
];

export default function Sidebar({
  activeSection,
  trashedCount,
  onSection,
  folders,
  overFolderId,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onAddSubfolder,
}: Props) {
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-border-subtle flex-col overflow-y-auto hidden md:flex">
      {/* Logo + Name */}
      <Link
        href="/"
        className="px-4 py-4 flex items-center gap-2.5 border-b border-surface hover:bg-background transition-colors"
      >
        <Image
          src="/yapdraw_logo.png"
          alt="YapDraw"
          width={24}
          height={24}
          className="rounded"
        />
        <h1 className="text-sm font-semibold text-foreground tracking-tight">
          YapDraw
        </h1>
      </Link>

      {/* Fixed sections */}
      <nav className="flex flex-col py-2">
        {FIXED_SECTIONS.map(({ id, label, icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => onSection(id)}
              className={`flex items-center gap-3 px-4 py-2 text-[13px] transition-colors text-left w-full ${
                isActive
                  ? "bg-surface text-foreground font-medium"
                  : "text-subtle hover:bg-background hover:text-foreground"
              }`}
            >
              <span className={isActive ? "text-foreground" : "text-placeholder"}>
                {icon}
              </span>
              <span>{label}</span>
              {id === "trash" && trashedCount > 0 && (
                <span className="ml-auto text-xs text-placeholder bg-surface px-1.5 py-0.5 rounded">
                  {trashedCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="h-px bg-surface mx-3" />

      {/* Folders section */}
      <div className="py-2 flex-1">
        <div className="flex items-center justify-between px-4 py-1.5">
          <span className="text-[11px] font-medium text-placeholder uppercase tracking-wider">
            Folders
          </span>
          <button
            onClick={onCreateFolder}
            className="p-1 rounded text-placeholder hover:text-foreground hover:bg-surface transition-colors"
            title="New folder"
          >
            <IconFolderPlus size={14} />
          </button>
        </div>

        {folders.length === 0 ? (
          <p className="px-4 py-1 text-xs text-placeholder">No folders yet</p>
        ) : (
          <FolderTree
            folders={folders}
            activeSection={activeSection}
            overFolderId={overFolderId}
            onSection={onSection}
            onRename={onRenameFolder}
            onDelete={onDeleteFolder}
            onAddSubfolder={onAddSubfolder}
          />
        )}
      </div>
    </aside>
  );
}
