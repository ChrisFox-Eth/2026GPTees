/**
 * @module components/ui/Tabs
 * @description A tabbed interface component for switching between different content panels
 * @since 2025-11-21
 */

/**
 * @component
 * @description A keyboard-accessible tabbed interface component with support for multiple content panels.
 * Includes full ARIA support and keyboard navigation (Arrow keys, Home, End).
 *
 * @param {TabsProps} props - Component props
 * @param {TabItem[]} props.items - Array of tabs (label and content for each tab)
 * @param {number} [props.defaultIndex=0] - Index of the tab to be active initially
 * @param {(index: number) => void} [props.onTabChange] - Optional callback invoked when the active tab changes (optional)
 * @param {string} [props.className] - Additional CSS classes for the outer Tabs container
 *
 * @returns {JSX.Element} Tabs navigation and content panel
 *
 * @example
 * const tabs = [
 *   { label: 'Home', content: <HomeContent /> },
 *   { label: 'Profile', content: <ProfileContent /> },
 * ];
 * <Tabs items={tabs} defaultIndex={0} />
 *
 * @see {@link TabsProps} for prop definitions
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
        className="flex border-b border-gray-200 dark:border-gray-700"
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
            className={`cursor-pointer border-b-2 px-4 py-2 focus:outline-none ${
              activeIndex === idx
                ? 'border-primary-600 text-primary-700 dark:text-primary-300'
                : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            } `}
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
