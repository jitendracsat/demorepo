"use client";

import { useState } from "react";
import LandingView from "./components/LandingView";
import MenuView from "./components/MenuView";

export default function Home() {
  const [view, setView] = useState<"landing" | "menu">("landing");

  return (
    <main className="min-h-screen relative bg-[#E6EDF3] font-sans">
      {view === "landing" ? (
        <LandingView onStepInsideAction={() => setView("menu")} />
      ) : (
        <MenuView onBackAction={() => setView("landing")} />
      )}
    </main>
  );
}