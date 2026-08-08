'use client';

import { Modal, Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export interface DeleteEducationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  educationNumber?: number | null;
  label?: string;
  onConfirm: () => void;
}

export function DeleteEducationModal({
  isOpen,
  onOpenChange,
  educationNumber,
  label,
  onConfirm,
}: DeleteEducationModalProps) {
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
                  <Modal.Heading>Remove education?</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p className="text-muted text-sm">
                    This will permanently remove{' '}
                    <span className="text-foreground font-medium">
                      {educationNumber
                        ? `Education #${educationNumber}`
                        : 'this education entry'}
                    </span>
                    {label ? (
                      <>
                        {' '}
                        (<span className="text-foreground">{label}</span>)
                      </>
                    ) : null}
                    .
                  </p>
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
                    Remove
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
