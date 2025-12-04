/**
 * @module pages/PrivacyPage
 * @description Privacy Policy page
 * @since 2025-11-21
 */

export default function PrivacyPage(): JSX.Element {
  return (
    <div className="container-max py-12">
      <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-gray-600 dark:text-gray-400">Last updated: November 2025</p>

        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us when you create an account, place an order, or communicate with us. This includes:
        </p>
        <ul>
          <li>Name and email address</li>
          <li>Shipping and billing addresses</li>
          <li>Payment information (processed securely through Stripe)</li>
          <li>Design prompts and AI-generated images</li>
          <li>Order history and preferences</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Process and fulfill your orders</li>
          <li>Generate custom designs using AI</li>
          <li>Send order confirmations and shipping updates</li>
          <li>Provide customer support</li>
          <li>Improve our services and user experience</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>3. Information Sharing</h2>
        <p>We share your information with trusted third-party service providers:</p>
        <ul>
          <li><strong>Clerk:</strong> Authentication and user management</li>
          <li><strong>Stripe:</strong> Payment processing</li>
          <li><strong>OpenAI:</strong> AI design generation (prompts only)</li>
          <li><strong>Printful:</strong> Order fulfillment and shipping</li>
          <li><strong>Supabase Storage:</strong> Secure image storage</li>
          <li><strong>Resend:</strong> Transactional email delivery</li>
        </ul>
        <p>We do not sell your personal information to third parties.</p>

        <h2>4. Data Security</h2>
        <p>
          We implement industry-standard security measures to protect your information, including encryption, secure servers, and regular security audits. Payment information is processed through PCI-compliant Stripe and never stored on our servers.
        </p>

        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and data</li>
          <li>Opt-out of marketing communications</li>
          <li>Export your data</li>
        </ul>

        <h2>6. Cookies</h2>
        <p>
          We use cookies and similar technologies to maintain your session, remember preferences, and analyze site usage. You can control cookies through your browser settings.
        </p>

        <h2>7. AI-Generated Content</h2>
        <p>
          Design prompts you provide are sent to OpenAI's DALL-E 3 API for image generation. Generated images are stored securely and associated with your account. We do not use your prompts or designs to train AI models.
        </p>

        <h2>8. Children's Privacy</h2>
        <p>
          Our service is not intended for users under 13 years of age. We do not knowingly collect information from children.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material changes by email or through our website.
        </p>

        <h2>10. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at:{' '}
          <a href="mailto:privacy@2026gptees.app">privacy@2026gptees.app</a>
        </p>
      </div>
    </div>
  );
}
