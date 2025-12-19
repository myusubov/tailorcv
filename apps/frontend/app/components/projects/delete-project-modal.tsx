'use client';

import { Modal, Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export interface DeleteProjectModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectNumber?: number | null;
  label?: string;
  onConfirm: () => void;
}

export function DeleteProjectModal({
  isOpen,
  onOpenChange,
  projectNumber,
  label,
  onConfirm,
}: DeleteProjectModalProps) {
  return (
    <Modal.Container
      variant="blur"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="w-full max-w-md"
    >
      <Modal.Dialog>
        {({ close }) => (
          <>
            <Modal.Header>
              <Modal.Icon className="bg-danger-soft text-foreground">
                <Icon icon="lucide:trash-2" className="text-danger size-5" />
              </Modal.Icon>
              <Modal.Heading>Remove project?</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted-foreground text-sm">
                This will permanently remove{' '}
                <span className="text-foreground font-medium">
                  {projectNumber ? `Project #${projectNumber}` : 'this project'}
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
  );
}
