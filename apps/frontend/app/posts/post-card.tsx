'use client';

import { Button, Card, Modal } from '@heroui/react';
import { Icon } from '@iconify/react';

const PostCard = ({ post }: { post: any }) => {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{post.title}</Card.Title>
      </Card.Header>
      <Card.Content>
        <Card.Description>{post.body}</Card.Description>
      </Card.Content>
      <Card.Footer>
        <Modal>
          <Button variant="secondary">Open Modal</Button>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[360px]">
              {({ close }) => (
                <>
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Icon className="bg-default text-foreground">
                      <Icon className="size-5" icon="gravity-ui:rocket" />
                    </Modal.Icon>
                    <Modal.Heading>Welcome to HeroUI</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p>
                      A beautiful, fast, and modern React UI library for
                      building accessible and customizable web applications with
                      ease.
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button className="w-full" onPress={close}>
                      Continue
                    </Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal>
      </Card.Footer>
    </Card>
  );
};

export default PostCard;
