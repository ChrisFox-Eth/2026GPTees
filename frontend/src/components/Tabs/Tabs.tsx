/**
 * @module components/Tabs/Tabs
 * @description A tabbed interface component for switching between different content panels.
 * Renders a list of tab buttons and displays the content of the selected tab.
 *
 * @component
 * @param {TabsProps} props - {@link Tabs.types.ts|TabsProps} for the tabs
 * @returns {JSX.Element} Tabs navigation and content
 *
 * @example
 * const tabs = [
 *   { label: 'Home', content: <HomeContent /> },
 *   { label: 'Profile', content: <ProfileContent /> },
 *   { label: 'Settings', content: <SettingsContent /> },
 * ];
 * <Tabs items={tabs} defaultIndex={0} />
 *
 * @since 2025-10-28
 * @version 1.0.0
 *
 * @features
 * - Renders a tab list with dynamic tab labels and corresponding content panels
 * - Maintains internal state for active tab, or can notify parent via onTabChange
 * - Keyboard accessible: Arrow keys move focus between tabs, Enter/Space activate tabs
 * - Active tab is styled with an underline highlight (primary color) for clarity
 * - Inactive tabs change color on hover/focus for discoverability
 * - Dark mode support for tab text and borders
 *
 * @accessibility
 * - Uses semantic roles: container has role="tablist", each tab has role="tab" and content has role="tabpanel"
 * - ARIA attributes for selection and relationships (aria-selected, aria-controls, aria-labelledby)
 * - Focus indicator and keyboard controls make navigation possible without a mouse
 *
 * @integration
 * Ideal for pages or components where you need to show different content in the same space based on user selection (e.g., profile sections, settings categories).
 */

import { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { TabsProps } from './Tabs.types';

export default function Tabs({
  items,
  defaultIndex = 0,
  onTabChange,
  className = '',
  ...rest
}: TabsProps): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /**
   * Handle a tab being clicked or activated
   */
  const selectTab = (index: number) => {
    setActiveIndex(index);
    onTabChange?.(index);
  };

  /**
   * Handle key events for keyboard navigation between tabs
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const count = items.length;
      let newIndex = index;
      if (e.key === 'ArrowRight') {
        newIndex = (index + 1) % count;
      } else if (e.key === 'ArrowLeft') {
        newIndex = (index - 1 + count) % count;
      }
      tabRefs.current[newIndex]?.focus();
      selectTab(newIndex);
    } else if (e.key === 'Home') {
      e.preventDefault();
      tabRefs.current[0]?.focus();
      selectTab(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastIndex = items.length - 1;
      tabRefs.current[lastIndex]?.focus();
      selectTab(lastIndex);
    }
  };

  return (
    <div className={className} {...rest}>
      {/* Tab list */}
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="border-b border-gray-200 dark:border-gray-700 flex"
      >
        {items.map((tab, idx) => (
          <button
            key={idx}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            role="tab"
            id={`tab-${idx}`}
            aria-selected={activeIndex === idx}
            aria-controls={`tabpanel-${idx}`}
            className={`
              px-4 py-2 focus:outline-none cursor-pointer border-b-2
              ${
                activeIndex === idx
                  ? 'border-primary-600 text-primary-700 dark:text-primary-300'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }
            `}
            onClick={() => selectTab(idx)}
            onKeyDown={(event) => handleKeyDown(event, idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <div
        id={`tabpanel-${activeIndex}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeIndex}`}
        className="mt-4"
      >
        {items[activeIndex]?.content}
      </div>
    </div>
  );
}
