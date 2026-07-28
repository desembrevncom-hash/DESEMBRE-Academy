import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicInstructorProfile } from "../services/publicCourseDetailApi";
import { getInitials } from "../utils/formatters";
import { GraduationCap, Sparkles, Globe, Facebook, Linkedin, ChevronRight, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstructorProfileHeroProps {
  instructor: PublicInstructorProfile;
}

export function InstructorProfileHero({ instructor }: InstructorProfileHeroProps) {
  const scrollToCourses = () => {
    const el = document.getElementById("instructor-courses-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const hasSocials =
    instructor.social_links &&
    (instructor.social_links.website ||
      instructor.social_links.facebook ||
      instructor.social_links.linkedin);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white py-12 sm:py-16 md:py-20">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-500/15 blur-[130px]" />
      </div>

      <div className="relative container mx-auto px-4 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-indigo-300/80 mb-6 flex-wrap font-medium">
          <Link to="/" className="hover:text-white transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400/60" />
          <Link to="/lich-khai-giang" className="hover:text-white transition-colors">Lịch đào tạo</Link>
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400/60" />
          <span className="text-white font-semibold">{instructor.full_name}</span>
        </nav>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 text-center md:text-left">
          {/* Avatar */}
          {instructor.avatar_url ? (
            <>
              <img
                src={instructor.avatar_url}
                alt={instructor.full_name}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-indigo-400/30 shadow-2xl shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const next = e.currentTarget.nextElementSibling;
                  if (next) next.classList.remove('hidden');
                }}
              />
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-extrabold text-3xl sm:text-4xl border-4 border-indigo-400/30 shadow-2xl shrink-0 hidden">
                {getInitials(instructor.full_name)}
              </div>
            </>
          ) : (
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-extrabold text-3xl sm:text-4xl border-4 border-indigo-400/30 shadow-2xl shrink-0">
              {getInitials(instructor.full_name)}
            </div>
          )}

          {/* Info */}
          <div className="space-y-3.5 flex-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <GraduationCap className="h-4 w-4 text-indigo-400" />
              <span>GIẢNG VIÊN DESEMBRE ACADEMY</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
              {instructor.full_name}
            </h1>

            {instructor.title && (
              <p className="text-indigo-200 text-sm sm:text-base font-semibold">
                {instructor.title}
              </p>
            )}

            {/* Expertise Tags */}
            {instructor.expertise && instructor.expertise.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5 pt-1">
                {instructor.expertise.map((exp, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-xs font-semibold bg-white/10 border border-white/15 px-3 py-1 rounded-full text-indigo-100"
                  >
                    {exp}
                  </span>
                ))}
              </div>
            )}

            {/* Social Links & CTA */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <Button
                onClick={scrollToCourses}
                className="h-11 px-6 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 transition-all"
              >
                <Calendar className="mr-2 w-4 h-4" />
                <span>Xem lịch đào tạo ({instructor.batches?.length || 0} lớp)</span>
              </Button>

              {hasSocials && (
                <div className="flex items-center gap-2 text-indigo-200">
                  {instructor.social_links.website && (
                    <a
                      href={instructor.social_links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      title="Website"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {instructor.social_links.facebook && (
                    <a
                      href={instructor.social_links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      title="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {instructor.social_links.linkedin && (
                    <a
                      href={instructor.social_links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
