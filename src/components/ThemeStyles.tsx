import { useEffect } from "react";
import { BrandingConfig } from "../types";

interface ThemeStylesProps {
  branding: BrandingConfig;
}

export default function ThemeStyles({ branding }: ThemeStylesProps) {
  useEffect(() => {
    // Also inject variables into root for convenience
    const root = document.documentElement;
    root.style.setProperty("--primary-color", branding.primaryColor);
    root.style.setProperty("--secondary-color", branding.secondaryColor);
    root.style.setProperty("--accent-color", branding.accentColor);
  }, [branding]);

  const css = `
    :root {
      --primary: ${branding.primaryColor};
      --secondary: ${branding.secondaryColor};
      --accent: ${branding.accentColor};
    }
    .bg-primary-custom { background-color: var(--primary); }
    .bg-primary-custom-hover:hover { background-color: var(--secondary); }
    .text-primary-custom { color: var(--primary); }
    .border-primary-custom { border-color: var(--primary); }
    .bg-secondary-custom { background-color: var(--secondary); }
    .text-secondary-custom { color: var(--secondary); }
    .bg-accent-custom { background-color: var(--accent); }
    .text-accent-custom { color: var(--accent); }
    .border-accent-custom { border-color: var(--accent); }
    .ring-primary-custom:focus { --tw-ring-color: var(--primary); }
  `;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
