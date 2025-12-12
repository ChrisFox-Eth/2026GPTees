/**
 * @module components/sections/Footer
 * @description Site footer with navigation links, legal information, and branding.
 * Uses the editorial design system with semantic tokens.
 * @since 2025-11-21
 */

import { Link } from 'react-router-dom';

/**
 * @component Footer
 * @description Renders the global site footer with four columns: Brand description, Explore navigation,
 * Legal links, and Support contacts. Uses the warm dark palette from the design system.
 *
 * @returns {JSX.Element} Footer element with multi-column navigation and information layout
 *
 * @example
 * <Footer />
 */
export default function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-ink py-16 text-surface dark:bg-paper-dark">
      <div className="container-max">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="mb-4 font-display text-2xl font-bold text-surface">
              GPTees
            </h3>
            <p className="font-sans text-sm leading-relaxed text-muted-dark">
              Custom apparel from your imagination. One idea, one tee, completely yours.
            </p>
          </div>

          {/* Create */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-surface">
              Create
            </h4>
            <ul className="space-y-3 font-sans text-sm">
              <li>
                <Link
                  to="/#quickstart"
                  className="text-muted-dark transition-colors hover:text-surface"
                >
                  Start Designing
                </Link>
              </li>
              <li>
                <Link
                  to="/gift"
                  className="text-muted-dark transition-colors hover:text-surface"
                >
                  Gift a Tee
                </Link>
              </li>
              <li>
                <Link
                  to="/account"
                  className="text-muted-dark transition-colors hover:text-surface"
                >
                  My Designs
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-surface">
              Legal
            </h4>
            <ul className="space-y-3 font-sans text-sm">
              <li>
                <Link
                  to="/privacy"
                  className="text-muted-dark transition-colors hover:text-surface"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-muted-dark transition-colors hover:text-surface"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  to="/refunds"
                  className="text-muted-dark transition-colors hover:text-surface"
                >
                  Refunds
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-surface">
              Support
            </h4>
            <ul className="space-y-3 font-sans text-sm">
              <li>
                <a
                  href="mailto:team@gptees.app"
                  className="text-muted-dark transition-colors hover:text-surface"
                >
                  team@gptees.app
                </a>
              </li>
              <li>
                <Link
                  to="/refunds"
                  className="text-muted-dark transition-colors hover:text-surface"
                >
                  Returns &amp; Refunds
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between border-t border-muted-dark/20 pt-8 font-sans text-sm md:flex-row">
          <p className="mb-4 text-muted-dark md:mb-0">
            &copy; {currentYear} GPTees. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-muted-dark">
            <span>Designed by you</span>
            <span className="text-muted-dark/40">·</span>
            <span>Printed by Printful</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
