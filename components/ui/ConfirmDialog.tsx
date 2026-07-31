"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type ConfirmDialogTone = "danger" | "primary";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  children?: ReactNode;
  description: ReactNode;
  loading?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: ReactNode;
  tone?: ConfirmDialogTone;
};

export function ConfirmDialog({
  cancelLabel = "Hủy",
  children,
  confirmLabel = "Xác nhận",
  description,
  loading = false,
  onConfirm,
  onOpenChange,
  open,
  title,
  tone = "primary",
}: ConfirmDialogProps) {
  return (
    <Modal
      description={description}
      footer={
        <>
          <Button disabled={loading} onClick={() => onOpenChange(false)} variant="outline">
            {cancelLabel}
          </Button>
          <Button
            loading={loading}
            loadingLabel="Đang xử lý..."
            onClick={onConfirm}
            variant={tone === "danger" ? "danger" : "primary"}
          >
            {confirmLabel}
          </Button>
        </>
      }
      onOpenChange={onOpenChange}
      open={open}
      title={title}
    >
      {children}
    </Modal>
  );
}
