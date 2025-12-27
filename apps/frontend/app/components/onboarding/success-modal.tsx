'use client';

import { Modal, Button, Card } from '@heroui/react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { GenerateOnboardingOutput } from '@/lib/types/onboarding';
import { ResumePDFTemplate } from './resume-pdf-template';
import { PDFDownloadLink } from '@react-pdf/renderer';

interface SuccessModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  data: GenerateOnboardingOutput | null;
}

export function SuccessModal({
  isOpen,
  onOpenChange,
  data,
}: SuccessModalProps) {
  if (!data || !data.data) return null;

  const { data: resumeData } = data;
  const { 
    contact, 
    summary = '', 
    skills = [], 
    experiences = [], 
    projects = [] 
  } = resumeData;

  const firstName = contact?.firstName ?? '';
  const lastName = contact?.lastName ?? '';
  const headline = contact?.headline ?? 'Software Professional';

  return (
    <Modal.Root isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop
        isKeyboardDismissDisabled
        isDismissable={false}
        variant="blur"
      >
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.Header className="flex-col items-center">
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-foreground mb-2 text-3xl font-bold tracking-tight"
                  >
                    Your Masterpiece is Ready!
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-muted-foreground max-w-sm text-center text-base"
                  >
                    We&apos;ve analyzed your profile and crafted a professional
                    foundation.
                  </motion.p>
                </Modal.Header>

                <Modal.Body>
                  <div className="flex flex-col items-center">
                    {/* Resume Preview Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="relative w-full"
                    >
                      <Card className="overflow-hidden bg-white text-slate-950 shadow-xl">
                        <Card.Content className="p-0">
                          <div className="bg-primary/5 border-divider flex items-center justify-between border-b px-6 py-3">
                            <div className="flex items-center gap-2">
                              <Icon
                                icon="lucide:file-text"
                                className="text-primary size-4"
                              />
                              <span className="text-primary text-[10px] font-bold tracking-widest uppercase">
                                ATS-Ready Draft
                              </span>
                            </div>
                            <PDFDownloadLink
                              document={<ResumePDFTemplate data={resumeData} />}
                              fileName={`${firstName}_${lastName}_Resume.pdf`}
                            >
                              {({ loading }) => (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  isDisabled={loading}
                                >
                                  {loading ? (
                                    <Icon
                                      icon="lucide:loader-2"
                                      className="mr-2 size-3.5 animate-spin"
                                    />
                                  ) : (
                                    <Icon
                                      icon="lucide:download"
                                      className="mr-2 size-3.5"
                                    />
                                  )}
                                  <span className="text-xs font-bold">
                                    {loading ? 'Generating...' : 'Download PDF'}
                                  </span>
                                </Button>
                              )}
                            </PDFDownloadLink>
                          </div>

                          <div className="p-8">
                            <div className="mb-8 flex items-start justify-between">
                              <div>
                                <h3 className="text-3xl leading-tight font-bold text-slate-950">
                                  {firstName} {lastName}
                                </h3>
                                <p className="text-primary mt-1 text-sm font-medium tracking-wider uppercase">
                                  {headline}
                                </p>
                              </div>
                            </div>

                            <div className="mb-10 space-y-4">
                              <div className="flex items-center gap-2 text-slate-400">
                                <div className="h-px grow bg-slate-100" />
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase">
                                  Summary
                                </span>
                                <div className="h-px grow bg-slate-100" />
                              </div>
                              <p className="line-clamp-3 px-4 text-center text-sm leading-relaxed text-slate-600 italic">
                                &quot;
                                {summary ||
                                  'Professional foundation ready for your first application.'}
                                &quot;
                              </p>
                            </div>

                            {/* Metric Badges */}
                            <div className="grid grid-cols-3 gap-4">
                              <div className="border-divider flex flex-col items-center rounded-2xl border bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                                <Icon
                                  icon="lucide:zap"
                                  className="text-primary mb-2 size-5"
                                />
                                <div className="text-xl font-bold text-slate-950">
                                  {skills?.length ?? 0}
                                </div>
                                <div className="text-default-500 text-center text-[10px] font-bold tracking-tight uppercase">
                                  Skills
                                </div>
                              </div>
                              <div className="border-divider flex flex-col items-center rounded-2xl border bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                                <Icon
                                  icon="lucide:briefcase"
                                  className="text-primary mb-2 size-5"
                                />
                                <div className="text-xl font-bold text-slate-950">
                                  {experiences?.length ?? 0}
                                </div>
                                <div className="text-default-500 text-center text-[10px] font-bold tracking-tight uppercase">
                                  Exp.
                                </div>
                              </div>
                              <div className="border-divider flex flex-col items-center rounded-2xl border bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                                <Icon
                                  icon="lucide:folder-git-2"
                                  className="text-primary mb-2 size-5"
                                />
                                <div className="text-xl font-bold text-slate-950">
                                  {projects?.length ?? 0}
                                </div>
                                <div className="text-default-500 text-center text-[10px] font-bold tracking-tight uppercase">
                                  Projects
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card.Content>
                      </Card>
                    </motion.div>
                  </div>
                </Modal.Body>

                <Modal.Footer className="flex flex-wrap">
                  <Button
                    className="group grow"
                    size="lg"
                    onPress={() => {
                      close();
                    }}
                  >
                    Tailor for First Job
                    <Icon
                      icon="lucide:arrow-right"
                      className="size-5 transition-all group-hover:translate-x-1"
                    />
                  </Button>
                  <Button
                    variant="tertiary"
                    className="grow"
                    size="lg"
                    onPress={() => {
                      close();
                    }}
                  >
                    Go to Dashboard
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
