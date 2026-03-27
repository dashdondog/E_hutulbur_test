"use client";

import {
  PenLine, Feather, BookOpen, Calculator, Atom, FlaskConical,
  Dna, Globe, Landmark, Scale, Languages, Monitor, Wrench,
  Palette, Music, HelpCircle,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { ComponentType } from "react";

const iconMap: Record<string, ComponentType<LucideProps>> = {
  PenLine, Feather, BookOpen, Calculator, Atom, FlaskConical,
  Dna, Globe, Landmark, Scale, Languages, Monitor, Wrench,
  Palette, Music,
};

interface Props {
  icon: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

export default function SubjectIcon({ icon, color, size = "md" }: Props) {
  const Icon = iconMap[icon] || HelpCircle;

  const sizes = {
    sm: { box: "w-8 h-8", icon: 16 },
    md: { box: "w-10 h-10", icon: 20 },
    lg: { box: "w-12 h-12", icon: 24 },
  };

  const s = sizes[size];

  return (
    <div
      className={`${s.box} rounded-xl flex items-center justify-center`}
      style={{ backgroundColor: color + "15" }}
    >
      <Icon size={s.icon} style={{ color }} strokeWidth={2} />
    </div>
  );
}
