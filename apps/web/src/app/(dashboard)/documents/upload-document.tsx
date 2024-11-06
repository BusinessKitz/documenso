'use client';

import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Loader } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

import { useLimits } from '@documenso/ee/server-only/limits/provider/client';
import { useAnalytics } from '@documenso/lib/client-only/hooks/use-analytics';
import { AppError } from '@documenso/lib/errors/app-error';
import { createDocumentData } from '@documenso/lib/server-only/document-data/create-document-data';
import { putPdfFile } from '@documenso/lib/universal/upload/put-file';
import { formatDocumentsPath } from '@documenso/lib/utils/teams';
import { TRPCClientError } from '@documenso/trpc/client';
import { trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { DocumentDropzone } from '@documenso/ui/primitives/document-dropzone';
import { useToast } from '@documenso/ui/primitives/use-toast';

export type UploadDocumentProps = {
  className?: string;
  team?: {
    id: number;
    url: string;
  };
};

export const UploadDocument = ({ className, team }: UploadDocumentProps) => {
  const router = useRouter();
  const analytics = useAnalytics();

  const { data: session } = useSession();

  const { toast } = useToast();

  const { quota, remaining } = useLimits();

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const { mutateAsync: createDocument } = trpc.document.createDocument.useMutation();

  const disabledMessage = useMemo(() => {
    if (remaining.documents === 0) {
      return team
        ? 'Document upload disabled due to unpaid invoices'
        : 'You have reached your document limit.';
    }

    if (!session?.user.emailVerified) {
      return 'Verify your email to upload documents.';
    }
  }, [remaining.documents, session?.user.emailVerified, team]);

  const onFileDrop = async (file: File) => {
    try {
      setIsLoading(true);

      const { type, data } = await putPdfFile(file);

      const { id: documentDataId } = await createDocumentData({
        type,
        data,
      });

      const { id } = await createDocument({
        title: file.name,
        documentDataId,
        teamId: team?.id,
      });

      toast({
        title: 'Document uploaded',
        description: 'Your document has been uploaded successfully.',
        duration: 5000,
      });

      analytics.capture('App: Document Uploaded', {
        userId: session?.user.id,
        documentId: id,
        timestamp: new Date().toISOString(),
      });

      router.push(`${formatDocumentsPath(team?.url)}/${id}/edit`);
    } catch (err) {
      const error = AppError.parseError(err);
      setIsLoading(false);
      console.error(err);

      if (error.code === 'INVALID_DOCUMENT_FILE') {
        toast({
          title: 'Invalid file',
          description: 'You cannot upload encrypted PDFs',
          variant: 'destructive',
        });
      } else if (err instanceof TRPCClientError) {
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'An error occurred while uploading your document.',
          variant: 'destructive',
        });
      }
    } finally {
      //setIsLoading(false);
    }
  };

  const onFileDropRejected = () => {
    toast({
      title: 'Your document failed to upload.',
      description: `Only PDF files are accepted.`,
      duration: 5000,
      variant: 'destructive',
    });
  };

  useEffect(() => {
    if (window.self !== window.top) {
      window.addEventListener(
        'message',
        (event) => {
          if (event.data && event.data.email && session) {
            if (!session || session.user.email !== event.data.email) {
              signOut().catch(() => {});
            } else {
              setIsAuthLoading(false);
            }
          }
        },
        false,
      );
    } else {
      setIsAuthLoading(false);
    }
  }, []);

  return (
    <div className={cn(className)}>
      <DocumentDropzone
        className="document-dropzone h-[min(400px,50vh)]"
        disabled={remaining.documents === 0 || !session?.user.emailVerified}
        disabledMessage={disabledMessage}
        onDrop={onFileDrop}
        onDropRejected={onFileDropRejected}
      />

      <div className="absolute -bottom-6 right-0">
        {team?.id === undefined &&
          remaining.documents > 0 &&
          Number.isFinite(remaining.documents) && (
            <p className="text-muted-foreground/60 text-xs">
              {remaining.documents} of {quota.documents} documents remaining this month.
            </p>
          )}
      </div>

      {(isLoading || isAuthLoading) && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-white opacity-50"
          style={{ zIndex: 100 }}
        >
          <Loader className="text-primary h-16 w-16 animate-spin" style={{ marginTop: '-265px' }} />
        </div>
      )}
    </div>
  );
};
