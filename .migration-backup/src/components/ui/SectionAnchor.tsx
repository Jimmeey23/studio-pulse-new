import * as React from "react";
import { useSectionNavigation } from "@/contexts/SectionNavigationContext";

type SectionAnchorProps = {
  id: string;
  label: string;
  activate?: () => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
};

export function SectionAnchor({ id, label, activate, children, className }: SectionAnchorProps) {
  const { addSection, removeSection } = useSectionNavigation();

  React.useEffect(() => {
    // Use activate directly without memoization to prevent dependency issues
    const activateFunction = activate || (() => {});
    addSection({ id, label, activate: activateFunction, getElement: () => document.getElementById(id) });
    return () => removeSection(id);
  }, [id, label]); // Only depend on id and label which are stable

  return (
    <section id={id} className={"scroll-mt-24 " + (className ?? "") }>
      {children}
    </section>
  );
}

export default SectionAnchor;
