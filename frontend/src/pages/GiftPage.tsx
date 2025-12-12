/**
 * @module pages/GiftPage
 * @description Premium gift landing page for purchasing GPTees gift codes.
 * Full promotional layout with hero, features, how-it-works, and purchase CTA.
 * @since 2025-11-21
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Button } from '@components/ui/Button';
import GPTeesCandid from '@assets/GPTeesCandid.png';
import GPTeesGift from '@assets/GPTeesGift.png';
import { apiPost } from '@utils/api';
import { trackEvent } from '@utils/analytics';
import { fadeUp, staggerContainer, staggerItem, MOTION_EASING, MOTION_DURATION } from '@utils/motion';
import type { GiftTierOption } from '../types/promo';

/**
 * @component GiftPage
 * @description Premium gift code purchase landing page. Features editorial hero section,
 * value propositions, how-it-works steps, testimonial-style social proof, and prominent
 * purchase CTA. Redirects to Stripe checkout for payment.
 *
 * @returns {JSX.Element} The rendered gift purchase landing page
 */
export default function GiftPage(): JSX.Element {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const navigate = useNavigate();
  const [tier] = useState<GiftTierOption>('PREMIUM');
  const [usageLimit] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track page view
  useEffect(() => {
    trackEvent('gift.page.view');
  }, []);

  const handlePurchase = async () => {
    // If not signed in, redirect to auth with return URL
    if (!isSignedIn) {
      navigate('/auth?redirect=/gift');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Please sign in to purchase a gift code.');
        return;
      }
      trackEvent('gift.purchase.start', { tier, usage_limit: usageLimit });
      const res = await apiPost('/api/gift-codes/purchase', { tier, usageLimit }, token);
      const url = res?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned. Please try again.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start gift purchase.';
      setError(message);
      trackEvent('gift.purchase.error', { message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
      ),
      title: 'Instant Delivery',
      description: 'Gift code delivered to your email immediately after purchase.',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: 'Personal & Unique',
      description: 'They design exactly what they want. No guessing sizes or styles.',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Never Expires',
      description: 'Gift codes are valid forever. No pressure, no rush.',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Purchase the gift',
      description: 'Quick checkout through Stripe. Takes less than a minute.',
    },
    {
      number: '2',
      title: 'Share the code',
      description: 'We email you the code instantly. Forward it or write it in a card.',
    },
    {
      number: '3',
      title: 'They create',
      description: 'Your recipient designs their perfect tee and we ship it to them.',
    },
  ];

  return (
    <div className="bg-paper dark:bg-paper-dark">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent-soft/30 to-transparent dark:from-accent-dark/10" />

        <div className="container-max relative py-20 md:py-32">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Hero Content */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="text-center md:text-left"
            >
              <motion.p
                variants={staggerItem}
                className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-accent dark:text-accent-dark"
              >
                The Perfect Gift
              </motion.p>

              <motion.h1
                variants={staggerItem}
                className="mb-6 font-serif-display text-4xl font-bold leading-tight text-ink dark:text-ink-dark md:text-5xl lg:text-6xl"
              >
                Give the gift of
                <span className="block text-accent dark:text-accent-dark">self-expression</span>
              </motion.h1>

              <motion.p
                variants={staggerItem}
                className="mb-8 max-w-lg font-sans text-lg leading-relaxed text-muted dark:text-muted-dark md:text-xl"
              >
                A custom tee they design themselves. Personal, meaningful, and completely unique to them.
              </motion.p>

              <motion.div variants={staggerItem} className="flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={isSubmitting}
                  className="min-w-[200px]"
                >
                  {isSubmitting ? 'Starting checkout...' : 'Gift a Tee — $54.99'}
                </Button>
                <Link to="/#quickstart">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Or design your own
                  </Button>
                </Link>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
                >
                  {error}
                </motion.div>
              )}
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: MOTION_DURATION.section, ease: MOTION_EASING, delay: 0.2 }}
              className="relative"
            >
              <div className="relative mx-auto max-w-md">
                {/* Decorative elements */}
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent/10 blur-2xl" />
                <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-accent-soft/50 blur-2xl" />

                {/* Main image placeholder */}
                <div className="relative overflow-hidden rounded-2xl shadow-lifted">
                  <img
                    src={GPTeesGift}
                    alt="Gift box with custom tee"
                    className="bg-surface dark:bg-surface-dark"
                  />
                  {/*
                    IDEAL IMAGE: A beautifully wrapped gift box (kraft paper or minimal white)
                    with a custom printed t-shirt peeking out or draped over it. Warm natural
                    lighting, perhaps some dried flowers or ribbon. Editorial gift photography style.

                    IMAGE GENERATION PROMPT:
                    "Editorial product photography of a gift-wrapped custom t-shirt, kraft paper
                    wrapping with minimal ribbon, warm natural lighting, soft shadows, clean
                    background, premium gift presentation, contemporary fashion catalog style,
                    4:5 aspect ratio"
                  */}
                </div>

                {/* Floating badge */}
                <div className="absolute -bottom-3 -right-3 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-medium">
                  Instant delivery
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="border-y border-surface-2 bg-surface py-16 dark:border-muted-dark/20 dark:bg-surface-dark">
        <div className="container-max">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={staggerItem}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent dark:bg-accent-dark/20 dark:text-accent-dark">
                  {feature.icon}
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-ink dark:text-ink-dark">
                  {feature.title}
                </h3>
                <p className="font-sans text-muted dark:text-muted-dark">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Gift a Tee */}
      <section className="py-20 md:py-28">
        <div className="container-max">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: MOTION_DURATION.section, ease: MOTION_EASING }}
              className="order-2 md:order-1"
            >
              <div className="relative">
                <img
                  src={GPTeesCandid}
                  alt="Person happily wearing their custom tee"
                  className="rounded-2xl"
                />
                {/*
                  IDEAL IMAGE: Person (any age/gender) wearing a custom graphic tee, genuine
                  smile, candid moment - maybe opening a gift or showing off their shirt proudly.
                  Warm, joyful photography style. Could be lifestyle or studio.

                  IMAGE GENERATION PROMPT:
                  "Candid portrait photography, person wearing custom graphic t-shirt, genuine
                  happy expression, warm natural lighting, soft background, contemporary lifestyle
                  photography, joyful moment captured, 4:5 aspect ratio"
                */}
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: MOTION_DURATION.section, ease: MOTION_EASING }}
              className="order-1 md:order-2"
            >
              <h2 className="mb-6 font-display text-3xl font-bold text-ink dark:text-ink-dark md:text-4xl">
                Why gift a custom tee?
              </h2>
              <div className="space-y-4 font-sans text-lg leading-relaxed text-muted dark:text-muted-dark">
                <p>
                  <strong className="text-ink dark:text-ink-dark">Skip the guessing game.</strong> No more
                  wondering about sizes, colors, or whether they'll actually wear it. They design exactly
                  what they want.
                </p>
                <p>
                  <strong className="text-ink dark:text-ink-dark">It's creative and fun.</strong> You're
                  not just giving a thing—you're giving an experience. They get to bring their own idea
                  to life.
                </p>
                <p>
                  <strong className="text-ink dark:text-ink-dark">Truly one-of-one.</strong> Every design
                  is unique. No one else in the world will have the same tee.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-surface-2 py-20 dark:bg-surface-dark md:py-28">
        <div className="container-max">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-display text-3xl font-bold text-ink dark:text-ink-dark md:text-4xl">
              How gifting works
            </h2>
            <p className="mx-auto max-w-2xl font-sans text-lg text-muted dark:text-muted-dark">
              Three simple steps. No wrapping required.
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                variants={staggerItem}
                className="relative"
              >
                {/* Connector line (hidden on mobile and last item) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-gradient-to-r from-accent/50 to-accent/10 md:block" />
                )}

                <div className="relative rounded-xl bg-paper p-8 text-center shadow-soft dark:bg-paper-dark">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white">
                    {step.number}
                  </div>
                  <h3 className="mb-2 font-display text-xl font-semibold text-ink dark:text-ink-dark">
                    {step.title}
                  </h3>
                  <p className="font-sans text-muted dark:text-muted-dark">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social Proof / Quote */}
      <section className="py-20 md:py-28">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: MOTION_DURATION.section, ease: MOTION_EASING }}
            className="mx-auto max-w-3xl text-center"
          >
            <svg className="mx-auto mb-6 h-10 w-10 text-accent/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <blockquote className="mb-6 font-serif-display text-2xl leading-relaxed text-ink dark:text-ink-dark md:text-3xl">
              "Best gift I've ever given. My boyfriend spent an hour designing his perfect tee and
              loved every minute of it."
            </blockquote>
            <p className="font-sans text-muted dark:text-muted-dark">
              — Nichole H.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-ink py-20 text-surface dark:bg-accent md:py-28">
        <div className="container-max">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: MOTION_DURATION.section, ease: MOTION_EASING }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="mb-4 font-display text-3xl font-bold md:text-4xl">
              Ready to make someone's day?
            </h2>
            <p className="mb-8 font-sans text-lg text-muted-dark dark:text-surface/80">
              One click to checkout. Gift code delivered instantly.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={handlePurchase}
                disabled={isSubmitting}
                className="min-w-[200px] bg-surface text-ink hover:bg-surface/90 dark:bg-paper dark:text-ink dark:hover:bg-paper/90"
              >
                {isSubmitting ? 'Starting checkout...' : 'Gift a Tee — $54.99'}
              </Button>
            </div>

            {!isSignedIn && isLoaded && (
              <p className="mt-4 text-sm text-muted-dark dark:text-surface/60">
                You'll be asked to sign in to complete your purchase.
              </p>
            )}

            {error && (
              <div className="mx-auto mt-4 max-w-md rounded-lg border border-red-400/50 bg-red-500/20 p-3 text-sm text-white">
                {error}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* FAQ / Details */}
      <section className="py-16">
        <div className="container-max">
          <div className="mx-auto max-w-2xl">
            <h3 className="mb-6 text-center font-display text-xl font-semibold text-ink dark:text-ink-dark">
              Good to know
            </h3>
            <div className="grid gap-4 font-sans text-sm text-muted dark:text-muted-dark sm:grid-cols-2">
              <div className="rounded-lg bg-surface-2 p-4 dark:bg-surface-dark">
                <strong className="text-ink dark:text-ink-dark">What's included?</strong>
                <p className="mt-1">The full Limitless experience: custom tee, studio access to explore design options, and shipping.</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-4 dark:bg-surface-dark">
                <strong className="text-ink dark:text-ink-dark">Does it expire?</strong>
                <p className="mt-1">Nope. Gift codes are valid forever. No pressure.</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-4 dark:bg-surface-dark">
                <strong className="text-ink dark:text-ink-dark">Can I buy multiple?</strong>
                <p className="mt-1">Absolutely. Each purchase gives you a unique code to share.</p>
              </div>
              <div className="rounded-lg bg-surface-2 p-4 dark:bg-surface-dark">
                <strong className="text-ink dark:text-ink-dark">What if they need help?</strong>
                <p className="mt-1">Our team is here. They can reach us anytime at team@gptees.app.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
