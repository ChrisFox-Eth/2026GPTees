/**
 * @module components/sections/Footer
 * @description Site footer with navigation links, legal information, and branding
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders the global site footer with four columns: Brand description, Explore navigation,
 * Legal links, and Support contacts. Includes dynamic copyright year and bottom bar with attribution.
 * Used on all pages as the site-wide footer.
 *
 * @returns {JSX.Element} Footer element with multi-column navigation and information layout
 *
 * @example
 * <Footer />
 */
import { Link } from 'react-router-dom';

export default function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-gray-900 py-12 text-gray-300">
      <div className="container-max">
        <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="mb-4 text-xl font-bold text-white">GPTees</h3>
            <p className="text-sm text-gray-400">
              One-of-one custom apparel. Turn your imagination into wearable art.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/#quickstart" className="transition-colors hover:text-white">
                  Start a Limitless tee
                </Link>
              </li>
              <li>
                <Link to="/gift" className="transition-colors hover:text-white">
                  Gift a GPTee
                </Link>
              </li>
              <li>
                <Link to="/#gallery" className="transition-colors hover:text-white">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/account" className="transition-colors hover:text-white">
                  My Designs
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/refunds" className="transition-colors hover:text-white">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:team@gptees.app" className="transition-colors hover:text-white">
                  Contact Us
                </a>
              </li>
              <li>
                <Link to="/refunds" className="transition-colors hover:text-white">
                  Refunds
                </Link>
              </li>
              <li>
                <span className="text-gray-500">Design-first support: team@gptees.app</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between border-t border-gray-800 pt-8 text-sm md:flex-row">
          <p className="mb-4 text-gray-400 md:mb-0">
            (c) {currentYear} GPTees. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-gray-400">
            <span>Hand-crafted artwork from your prompt</span>
            <span>|</span>
            <span>Fulfilled by Printful</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
