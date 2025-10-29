/**
 * @module components/MotionStaggerList/MotionStaggerList.types
 * @description Type definitions for the MotionStaggerList component.
 * @since 2025-10-29
 */

import React from 'react';

/**
 * Definition of a list item for the staggered animation.
 */
export interface MotionStaggerListItem {
  /** Unique identifier for the item (used as React key). */
  id: string;
  /** Main label rendered for the item. */
  label: string;
  /** Optional supporting text displayed beneath the label. */
  description?: string;
}

/**
 * Props for the MotionStaggerList component.
 */
export interface MotionStaggerListProps extends React.HTMLAttributes<HTMLUListElement> {
  /** Items to render and animate. */
  items: MotionStaggerListItem[];
  /** Whether to enable alternating background stripes. */
  striped?: boolean;
}
