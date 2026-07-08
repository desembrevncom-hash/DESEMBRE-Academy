import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CourseCategory } from "@/types";

export function CategoryCard({ category }: { category: CourseCategory }) {
  const Icon = (Icons as unknown as Record<string, LucideIcon>)[category.icon] ?? Icons.BookOpen;
  return (
    <Link
      to="/courses"
      search={{ category: category.slug }}
      className="group block rounded-3xl border border-border/70 bg-card p-6 card-hover text-center"
    >
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary-dark/15 text-primary-dark">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{category.name}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{category.courseCount} khóa học</p>
    </Link>
  );
}
