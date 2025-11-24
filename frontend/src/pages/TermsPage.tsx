/**
 * @module pages/TermsPage
 * @description Terms of Service page
 * @since 2025-11-21
 */

export default function TermsPage(): JSX.Element {
  return (
    <div className="container-max py-12">
      <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-gray-600 dark:text-gray-400">Last updated: November 21, 2025</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using 2026GPTees ("Service"), you agree to be bound by these Terms of Service. If you do not agree, you may not use our Service.
        </p>

        <h2>2. Service Description</h2>
        <p>
          2026GPTees provides AI-powered custom apparel design and printing services. Users submit text prompts to generate unique designs using OpenAI's DALL-E 3, which are then printed on selected products and shipped by our fulfillment partner, Printful.
        </p>

        <h2>3. User Accounts</h2>
        <p>To use our Service, you must:</p>
        <ul>
          <li>Be at least 13 years of age</li>
          <li>Provide accurate and complete registration information</li>
          <li>Maintain the security of your account credentials</li>
          <li>Notify us immediately of any unauthorized access</li>
        </ul>

        <h2>4. Orders and Payment</h2>
        <h3>4.1 Pay-First Model</h3>
        <p>
          Payment is required before AI design generation. Once payment is processed, you gain access to generate designs according to your selected tier (Basic: 1 design, Premium: unlimited).
        </p>

        <h3>4.2 Pricing</h3>
        <ul>
          <li>Basic Tier: $34.99 (product + 1 design generation)</li>
          <li>Premium Tier: $54.99 (product + unlimited design generations)</li>
          <li>Prices include design generation but exclude shipping</li>
        </ul>

        <h3>4.3 Order Processing</h3>
        <p>
          After you approve a design, your order is submitted to Printful for printing and shipping. Production typically takes 2-5 business days, plus shipping time.
        </p>

        <h2>5. Design Generation</h2>
        <h3>5.1 Content Guidelines</h3>
        <p>You agree not to generate designs that:</p>
        <ul>
          <li>Contain illegal, harmful, or offensive content</li>
          <li>Infringe on intellectual property rights</li>
          <li>Violate OpenAI's usage policies</li>
          <li>Include hate speech, violence, or adult content</li>
        </ul>

        <h3>5.2 Content Moderation</h3>
        <p>
          All prompts are subject to automated content moderation. We reserve the right to reject designs that violate our guidelines.
        </p>

        <h3>5.3 Design Ownership</h3>
        <p>
          You retain rights to the final approved design. However, AI-generated content may not be eligible for copyright protection in all jurisdictions.
        </p>

        <h2>6. Refunds and Returns</h2>
        <p>
          Please see our <a href="/refunds">Refund Policy</a> for detailed information on returns, cancellations, and refunds.
        </p>

        <h2>7. Intellectual Property</h2>
        <h3>7.1 Our Rights</h3>
        <p>
          The Service, including its design, features, and code, is owned by 2026GPTees and protected by intellectual property laws.
        </p>

        <h3>7.2 User Content</h3>
        <p>
          By submitting prompts and approving designs, you grant us a license to use, display, and process them to fulfill your order.
        </p>

        <h2>8. Prohibited Activities</h2>
        <p>You may not:</p>
        <ul>
          <li>Use the Service for any illegal purpose</li>
          <li>Attempt to circumvent security measures</li>
          <li>Reverse engineer or scrape our Service</li>
          <li>Impersonate others or provide false information</li>
          <li>Interfere with other users' access to the Service</li>
        </ul>

        <h2>9. Disclaimer of Warranties</h2>
        <p>
          The Service is provided "as is" without warranties of any kind. We do not guarantee that AI-generated designs will meet your expectations or be error-free.
        </p>

        <h2>10. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, 2026GPTees shall not be liable for indirect, incidental, special, or consequential damages arising from your use of the Service.
        </p>

        <h2>11. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account for violations of these Terms or for any reason at our discretion.
        </p>

        <h2>12. Changes to Terms</h2>
        <p>
          We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
        </p>

        <h2>13. Governing Law</h2>
        <p>
          These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles.
        </p>

        <h2>14. Contact Information</h2>
        <p>
          For questions about these Terms, contact us at:{' '}
          <a href="mailto:legal@2026gptees.com">legal@2026gptees.com</a>
        </p>
      </div>
    </div>
  );
}
