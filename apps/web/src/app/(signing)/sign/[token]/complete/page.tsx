import Link from 'next/link';
import {notFound} from 'next/navigation';

import {CheckCircle2, Clock8} from 'lucide-react';
import {getServerSession} from 'next-auth';
import {env} from 'next-runtime-env';
import {match} from 'ts-pattern';

import signingCelebration from '@documenso/assets/images/signing-celebration.png';
import {getServerComponentSession} from '@documenso/lib/next-auth/get-server-component-session';
import {getDocumentAndSenderByToken} from '@documenso/lib/server-only/document/get-document-by-token';
import {isRecipientAuthorized} from '@documenso/lib/server-only/document/is-recipient-authorized';
import {getFieldsForToken} from '@documenso/lib/server-only/field/get-fields-for-token';
import {getRecipientByToken} from '@documenso/lib/server-only/recipient/get-recipient-by-token';
import {getRecipientSignatures} from '@documenso/lib/server-only/recipient/get-recipient-signatures';
import {DocumentStatus, FieldType, RecipientRole} from '@documenso/prisma/client';
import {DocumentDownloadButton} from '@documenso/ui/components/document/document-download-button';
import {DocumentShareButton} from '@documenso/ui/components/document/document-share-button';
import {SigningCard3D} from '@documenso/ui/components/signing-card';
import {cn} from '@documenso/ui/lib/utils';
import {Badge} from '@documenso/ui/primitives/badge';

import {truncateTitle} from '~/helpers/truncate-title';

import {SigningAuthPageView} from '../signing-auth-page';
import {ClaimAccount} from './claim-account';
import {DocumentPreviewButton} from './document-preview-button';

export type CompletedSigningPageProps = {
  params: {
    token?: string;
  };
};

export default async function CompletedSigningPage({
                                                     params: {token},
                                                   }: CompletedSigningPageProps) {
  const NEXT_PUBLIC_DISABLE_SIGNUP = env('NEXT_PUBLIC_DISABLE_SIGNUP');

  if (!token) {
    return notFound();
  }

  const {user} = await getServerComponentSession();

  const document = await getDocumentAndSenderByToken({
    token,
    requireAccessAuth: false,
  }).catch(() => null);

  if (!document || !document.documentData) {
    return notFound();
  }

  const truncatedTitle = truncateTitle(document.title);

  const {documentData} = document;

  const [fields, recipient] = await Promise.all([
    getFieldsForToken({token}),
    getRecipientByToken({token}).catch(() => null),
  ]);

  if (!recipient) {
    return notFound();
  }

  const isDocumentAccessValid = await isRecipientAuthorized({
    type: 'ACCESS',
    document,
    recipient,
    userId: user?.id,
  });

  if (!isDocumentAccessValid) {
    return <SigningAuthPageView email={recipient.email}/>;
  }

  const signatures = await getRecipientSignatures({recipientId: recipient.id});

  const recipientName =
    recipient.name ||
    fields.find((field) => field.type === FieldType.NAME)?.customText ||
    recipient.email;

  const sessionData = await getServerSession();
  const isLoggedIn = !!sessionData?.user;
  const canSignUp = !isLoggedIn && NEXT_PUBLIC_DISABLE_SIGNUP !== 'true';

  return (
    <div
      className={cn(
        '-mx-4 flex flex-col items-center px-4  md:-mx-8 md:px-8',
        {'pt-0 lg:pt-0 xl:pt-0': canSignUp},
      )}
    >
      <div
        className={cn('relative mt-6 flex w-full flex-col items-center justify-center', {
          'mt-0 flex-col divide-y overflow-hidden pt-6 md:pt-16 lg:flex-row lg:divide-x lg:divide-y-0 lg:pt-20 xl:pt-24':
          canSignUp,
        })}
      >
        <div
          className={cn('flex flex-col items-center', {
            'mb-8 p-4 md:mb-0 md:p-12': canSignUp,
          })}
        >
          {isLoggedIn && (
            <Link href="/documents" className="text-documenso-700 mb-5">
              Back to documents
            </Link>
          )}
          <Badge variant="neutral" size="default" className="mb-6 rounded-xl border bg-transparent">
            {truncatedTitle}
          </Badge>

          {/* Card with recipient */}
          <SigningCard3D
            name={recipientName}
            signature={signatures.at(0)}
            signingCelebrationImage={signingCelebration}
          />

          <h2 className="mt-6 max-w-[35ch] text-center text-2xl font-semibold leading-normal md:text-3xl lg:text-4xl">
            Document
            {recipient.role === RecipientRole.SIGNER && ' signed '}
            {recipient.role === RecipientRole.VIEWER && ' viewed '}
            {recipient.role === RecipientRole.APPROVER && ' approved '}
          </h2>

          {match({status: document.status, deletedAt: document.deletedAt})
            .with({status: DocumentStatus.COMPLETED}, () => (
              <div className="text-documenso-700 mt-4 flex items-center text-center">
                <CheckCircle2 className="mr-2 h-5 w-5"/>
                <span className="text-sm">Everyone has signed</span>
              </div>
            ))
            .with({deletedAt: null}, () => (
              <div className="flex items-center mt-4 text-center text-[#6414DB]">
                <Clock8 className="mr-2 h-5 w-5"/>
                <span className="text-sm">Waiting for others to sign</span>
              </div>
            ))
            .otherwise(() => (
              <div className="flex items-center text-center text-red-600">
                <Clock8 className="mr-2 h-5 w-5"/>
                <span className="text-sm">Document no longer available to sign</span>
              </div>
            ))}

          {match({status: document.status, deletedAt: document.deletedAt})
            .with({status: DocumentStatus.COMPLETED}, () => (
              <p className="text-muted-foreground/60 mt-2.5 max-w-[60ch] text-center text-sm font-medium md:text-base">
                Everyone has signed! You will receive an email copy of the signed document.
              </p>
            ))
            .with({deletedAt: null}, () => (
              <p className="text-muted-foreground/60 mt-2.5 max-w-[60ch] text-center text-sm font-medium md:text-base">
                You will receive an email copy of the signed document once everyone has signed.
              </p>
            ))
            .otherwise(() => (
              <p className="text-muted-foreground/60 mt-2.5 max-w-[60ch] text-center text-sm font-medium md:text-base">
                This document has been cancelled by the owner and is no longer available for others
                to sign.
              </p>
            ))}

          <div className="mt-8 flex w-full max-w-sm items-center justify-center gap-4">
            {/*<DocumentShareButton documentId={document.id} token={recipient.token} />*/}

            {document.status === DocumentStatus.COMPLETED ? (
              <DocumentDownloadButton
                className="flex-1"
                fileName={document.title}
                documentData={documentData}
                disabled={document.status !== DocumentStatus.COMPLETED}
              />
            ) : (
              <DocumentPreviewButton
                className="text-[11px]"
                title="Signatures will appear once the document has been completed"
                documentData={documentData}
              />
            )}
          </div>
        </div>

        {/*canSignUp && (
          <div className={`flex max-w-xl flex-col items-center justify-center p-4 md:p-12`}>
            <h2 className="mt-8 text-center text-xl font-semibold md:mt-0">
              Need to sign documents?
            </h2>

            <p className="text-muted-foreground/60 mt-4 max-w-[55ch] text-center leading-normal">
              Create your account and start using state-of-the-art document signing.
            </p>

            <ClaimAccount defaultName={recipientName} defaultEmail={recipient.email}/>
          </div>
        )*/}
      </div>
    </div>
  );
}
