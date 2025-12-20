import type { WebhookEvent } from '@clerk/express/webhooks';

import { prisma } from '../lib';

const getPrimaryEmailFromClerkUser = (user: any): string => {
  if (!user?.email_addresses || !Array.isArray(user.email_addresses)) {
    return '';
  }

  const primaryId = user.primary_email_address_id as string | undefined;

  const primaryEmail =
    user.email_addresses.find(
      (email: any) => primaryId && email.id === primaryId,
    )?.email_address ?? user.email_addresses[0]?.email_address;

  return primaryEmail ?? '';
};

export const handleClerkUserWebhook = async (evt: WebhookEvent) => {
  if (!evt.type.startsWith('user.')) return;

  if (evt.type === 'user.deleted') {
    const clerkUserId = (evt.data as any)?.id as string | undefined;
    if (!clerkUserId) return;

    try {
      await prisma.user.delete({
        where: { clerkUserId },
      });
    } catch (error) {
      console.error(`Error deleting user ${clerkUserId}:`, error);
    }
    return;
  }

  const user = evt.data as any;
  const clerkUserId = user.id as string | undefined;
  if (!clerkUserId) return;

  const email = getPrimaryEmailFromClerkUser(user);

  await prisma.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      email,
      firstName: user.first_name ?? '',
      lastName: user.last_name ?? '',
    },
    update: {
      email,
      firstName: user.first_name ?? '',
      lastName: user.last_name ?? '',
    },
  });
};
