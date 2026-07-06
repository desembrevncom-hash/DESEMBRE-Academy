import { useContext } from "react";
import { CourseRuntimeContext, CourseRuntimeContextType } from "./CourseRuntimeProvider";

export function useCourseRuntime(): CourseRuntimeContextType {
  const context = useContext(CourseRuntimeContext);
  if (context === undefined) {
    throw new Error("useCourseRuntime must be used within a CourseRuntimeProvider");
  }
  return context;
}
