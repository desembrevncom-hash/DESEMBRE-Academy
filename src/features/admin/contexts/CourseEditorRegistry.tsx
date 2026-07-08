/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo } from "react";
import type { AcademyAdminCourseEditor } from "../types";

export interface EditorDirtyRegistry {
  isReadOnly: boolean;
  settingsDirty: boolean;
  contentDirty: boolean;
  activeMutation: boolean;
  setSettingsDirty: (value: boolean) => void;
  setContentDirty: (value: boolean) => void;
  setActiveMutation: (value: boolean) => void;
  editorData: AcademyAdminCourseEditor;
}

const CourseEditorRegistryContext = createContext<EditorDirtyRegistry | null>(null);

export function CourseEditorRegistryProvider({
  children,
  editorData,
}: {
  children: React.ReactNode;
  editorData: AcademyAdminCourseEditor;
}) {
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);
  const [activeMutation, setActiveMutation] = useState(false);

  // Authoritative read-only derived from exact course status
  const isReadOnly = editorData.course.status === "archived";

  const value = useMemo(
    () => ({
      isReadOnly,
      settingsDirty,
      contentDirty,
      activeMutation,
      setSettingsDirty,
      setContentDirty,
      setActiveMutation,
      editorData,
    }),
    [isReadOnly, settingsDirty, contentDirty, activeMutation, editorData],
  );

  return (
    <CourseEditorRegistryContext.Provider value={value}>
      {children}
    </CourseEditorRegistryContext.Provider>
  );
}

export function useCourseEditorRegistry() {
  const context = useContext(CourseEditorRegistryContext);
  if (!context) {
    throw new Error("useCourseEditorRegistry must be used within a CourseEditorRegistryProvider");
  }
  return context;
}
