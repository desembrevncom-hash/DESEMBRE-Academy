import { useContext } from "react";
import { StudentContext } from "./StudentProvider";

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error("useStudent must be used within a StudentProvider");
  }
  return context;
}
