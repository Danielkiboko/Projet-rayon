import React from "react";
import { Download, Plus } from "lucide-react";

interface ModalActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  submitIcon?: "download" | "plus";
  submitText: string;
}

export default function ModalActions({ onCancel, isSubmitting, submitIcon = "download", submitText }: ModalActionsProps) {
  const Icon = submitIcon === "plus" ? Plus : Download;
  return (
    <div className="pt-4 flex gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
      >
        Annuler
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex justify-center items-center gap-2"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Icon size={16} />
            {submitText}
          </>
        )}
      </button>
    </div>
  );
}
