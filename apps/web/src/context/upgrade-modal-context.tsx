"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { UpgradeModal } from "@/components/ui/upgrade-modal";

interface UpgradeModalContextType {
  openModal: (message?: string) => void;
  closeModal: () => void;
}

const UpgradeModalContext = createContext<UpgradeModalContextType | undefined>(undefined);

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string>("Upgrade to Pro to unlock this feature.");

  const openModal = (customMessage?: string) => {
    if (customMessage) setMessage(customMessage);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <UpgradeModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <UpgradeModal isOpen={isOpen} onClose={closeModal} message={message} />
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const context = useContext(UpgradeModalContext);
  if (context === undefined) {
    throw new Error("useUpgradeModal must be used within an UpgradeModalProvider");
  }
  return context;
}
