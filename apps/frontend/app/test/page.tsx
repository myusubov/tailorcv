'use client';
import { UserButton } from '@clerk/nextjs';
import { config } from '@/lib/config';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { Icon } from '@iconify/react';

export default function TestPage() {
  const state = useOverlayState();

  return (
    <div className="flex h-svh w-full items-center justify-center">
      <UserButton signInUrl={config.auth.signInUrl} />
      <Button onPress={state.open}>Open Modal</Button>
      <Modal.Container isOpen={state.isOpen} onOpenChange={state.setOpen}>
        <Modal.Dialog className="sm:max-w-[360px]">
          {({ close }) => (
            <>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-success-soft text-success-soft-foreground">
                  <Icon className="size-5" icon="gravity-ui:circle-check" />
                </Modal.Icon>
                <Modal.Heading>Controlled with useOverlayState()</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>
                  The <code>useOverlayState</code> hook provides dedicated
                  methods for common operations. No need to manually create
                  callbacks—just use <code>state.open()</code>,{' '}
                  <code>state.close()</code>, or <code>state.toggle()</code>.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onPress={close}>
                  Cancel
                </Button>
                <Button onPress={close}>Confirm</Button>
              </Modal.Footer>
            </>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </div>
  );
}
