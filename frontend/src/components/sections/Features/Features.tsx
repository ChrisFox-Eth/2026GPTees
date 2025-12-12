/**
 * @module components/sections/Features
 * @description Features section highlighting platform capabilities and value propositions
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders a grid of feature cards highlighting GPTees platform capabilities including
 * one-of-one urgency, design-first flow, limitless redraws, true-to-color mockups, premium quality,
 * fast turnaround, and security. Currently hidden via CSS (hidden class on section). Used on the
 * homepage to communicate value propositions.
 *
 * @returns {JSX.Element} Section element with grid of feature cards (currently hidden)
 *
 * @example
 * <Features />
 */
export default function Features(): JSX.Element {
  const features = [
    {
      title: 'One-of-one urgency',
      description:
        'Every tee is a single, custom creation from your words—no template library or reselling.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: 'Design-first flow',
      description:
        'Create a preview immediately, keep your idea safe, and pay only after you approve.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
    },
    {
      title: 'Limitless redraws',
      description: 'Iterate with fresh ideas until you land the exact look you want—no caps.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
    },
    {
      title: 'True-to-color mockups',
      description: 'Preview on all four shirt colors and choose size/fit after you see the art.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V7a2 2 0 00-2-2h-2l-2-2H8L6 5H4a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 13l3.38-3.38a2 2 0 012.829 0L12 12.414l1.293-1.293a2 2 0 012.828 0L21 15"
          />
        </svg>
      ),
    },
    {
      title: 'Premium Quality',
      description:
        'High-quality, comfortable fabrics printed with professional-grade equipment. Your design will look amazing and last.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
    },
    {
      title: 'Fast turnaround',
      description:
        'Designs in seconds. Printing and shipping typically 5-8 business days with tracking.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: 'Secure & Easy',
      description:
        'Safe payment processing, email confirmations, and order tracking. Your data is protected with enterprise-grade security.',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="hidden py-20">
      <div className="container-max">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-display font-bold leading-tight text-gray-900 md:text-5xl dark:text-white">
            Why Choose GPTees?
          </h2>
          <p className="mx-auto max-w-2xl text-base font-sans leading-relaxed text-gray-600 md:text-lg dark:text-gray-300">
            One-of-one drops made from your words—design first with limitless redraws.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-shadow hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-xl font-display font-bold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="font-sans leading-relaxed text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
