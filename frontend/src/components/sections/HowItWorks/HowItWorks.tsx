/**
 * @module components/sections/HowItWorks
 * @description How It Works section explaining the four-step GPTees design and ordering process
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders a four-step process guide explaining how to use GPTees: 1) Start a free preview,
 * 2) Describe your design, 3) Limitless redraws, 4) Pick fit, pay, and ship. Each step features an
 * icon, number badge, title, and description. Includes gradient connection lines between steps on desktop.
 *
 * @returns {JSX.Element} Section element with grid of process step cards
 *
 * @example
 * <HowItWorks />
 */
export default function HowItWorks(): JSX.Element {
  const steps = [
    {
      number: '1',
      title: 'Start a free preview',
      description:
        'Jump into Quickstart, capture your prompt, and we create a preview order without payment. Your spot is saved, even before login.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
      ),
    },
    {
      number: '2',
      title: 'Describe Your Design',
      description:
        'Tell us what to print. Be playful! From "cyberpunk cat warrior" to "minimalist mountain sunset".',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      number: '3',
      title: 'Limitless redraws',
      description:
        'We turn your words into artwork in seconds. Keep refining the prompt until you love it—no caps, all included.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      number: '4',
      title: 'Pick fit, pay, and ship',
      description:
        'Preview on all four shirt colors, choose size and fit, then check out. We print and ship once you approve.',
      icon: (
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="bg-gray-50 py-20 dark:bg-gray-800/50">
      <div className="container-max">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl dark:text-white">
            How It Works
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600 dark:text-gray-300">
            From idea to wearable art in just a few clicks. It's that simple.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connection Line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="from-primary-400 absolute top-16 left-1/2 hidden h-0.5 w-full bg-gradient-to-r to-transparent lg:block" />
              )}

              {/* Step Card */}
              <div className="relative rounded-xl bg-white p-6 shadow-lg transition-shadow hover:shadow-xl dark:bg-gray-800">
                {/* Step Number */}
                <div className="from-primary-600 absolute -top-4 left-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r to-purple-600 text-xl font-bold text-white shadow-lg">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="text-primary-600 dark:text-primary-400 mt-8 mb-4">{step.icon}</div>

                {/* Content */}
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
