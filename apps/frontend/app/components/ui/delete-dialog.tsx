'use client';

import { Modal, Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export interface DeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title?: string;
  description: React.ReactNode;
  onConfirm: () => void;
  confirmLabel?: string;
}

export function DeleteDialog({
  isOpen,
  onOpenChange,
  title = 'Confirm Deletion',
  description,
  onConfirm,
  confirmLabel = 'Remove',
}: DeleteDialogProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop variant="blur">
        <Modal.Container className="w-full max-w-md">
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.Header>
                  <Modal.Icon className="bg-danger-soft text-foreground">
                    <Icon
                      icon="lucide:trash-2"
                      className="text-danger size-5"
                    />
                  </Modal.Icon>
                  <Modal.Heading>{title}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <div className="text-muted-foreground text-sm">
                    {description}
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="tertiary" onPress={close}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onPress={() => {
                      onConfirm();
                      close();
                    }}
                  >
                    {confirmLabel}
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
