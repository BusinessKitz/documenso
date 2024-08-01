import Link from 'next/link';

import {Button} from '@documenso/ui/primitives/button';

export default function SignatureDisclosure() {
  return (
    <div>
      <article className="prose dark:prose-invert">
        <h1>Signature Disclosure</h1>
        <p>By opting to use an electronic signature on our platform, you are agreeing to the terms and conditions
          outlined below.</p>

        <h2>Electronic signature requirements</h2>
        <p>
          When you use our platform and the document signing feature, it will be governed by Section 10 of the
          ELECTRONIC TRANSACTIONS ACT 1999 and the applicable governing State or Territory legislation.
        </p>
        <p>
          In Australia, under the Electronic Transactions Act 1999, an electronic signature is an accepted form of
          signature, as that of a ‘wet ink’ signature in most circumstances.
        </p>
        <p>
          The method used must be connected to electronic communication. It must also be either as reliable as
          appropriate in the circumstances, or proven to be accurate. You must ensure:
        </p>
        <ul>
          <li>Your identity could be shown by a typed name, a personal mark, a personal email, or use of an online ID
            verification method; and
          </li>
          <li>Your intention to sign the document can be shown by a clear agreement, signing on the dotted line, or
            something extra in the context of a response.
          </li>
        </ul>

        <h2>Consent and system requirements </h2>
        <p>You hereby consent to use electronic means to sign documents and receive notifications.</p>
        <p>
          You must ensure you have access to the following when using the document signing feature on our platform:
        </p>
        <ul>
          <li>A stable internet connection</li>
          <li>An email account</li>
          <li>A device capable of accessing, opening, and reading documents</li>
          <li>A means to print or download documents for your records</li>
        </ul>

        <h2>Delivery of electronic documents</h2>
        <p>
          All documents related to the electronic signing process will be provided to you electronically through our
          platform or via email. It is your responsibility to ensure that your email address is current and that you can
          receive and open our emails.
        </p>

        <h2>Consent to electronic transactions</h2>
        <p>By using the document signature feature, you are consenting to conduct transactions and receive disclosures
          electronically. You acknowledge that your electronic signature on documents is binding and that you accept the
          terms outlined in the documents you are signing.</p>
        <p>You have the right to withdraw your consent or not sign the document. To withdraw your consent, please
          contact the sender of the document.</p>

        <h2>Your information</h2>
        <p>
          It is crucial to keep your contact information, especially your email address, up to date with us. Please
          notify us immediately of any changes to ensure that you continue to receive all necessary communications.
        </p>

        <h2>Record of signed documents</h2>
        <p>
          After signing a document electronically, you will be provided the opportunity to view, download, and print the
          document for your records. It is highly recommended that you retain a copy of all electronically signed
          documents for your personal records. We will also retain a copy of the signed document for our records however
          we may not be able to provide you with a copy of the signed document after a certain period of time.
        </p>

        <h2>Acknowledgements and contact details</h2>
        <p>
          By proceeding to use the electronic signature service you confirm that you have read and understood this
          Signature Disclosure. You agree to all terms and conditions related to the use of electronic signatures and
          electronic transactions as outlined herein.
        </p>
        <p>
          For any questions regarding this Signature Disclosure or Business Kitz platform, you may contact us by
          emailing <a href="mailto:support@businesskitz.com.au">support@businesskitz.com.au</a>
        </p>
      </article>

      <div className="mt-8">
        <Button asChild>
          <Link href="/documents">Back to Documents</Link>
        </Button>
      </div>
    </div>
  );
}
