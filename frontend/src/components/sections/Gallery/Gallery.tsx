/**
 * @module components/sections/Gallery
 * @description Interactive component gallery used on the homepage to preview reusable UI elements.
 * Renders curated sections that highlight the available components, their variants, and example usage.
 * @since 2025-11-21
 */

/**
 * @component
 * @description Renders a comprehensive UI component gallery showcasing Buttons, Cards, Alerts, Inputs,
 * Tables, Tabs, Grid layouts, and Modals with various configurations and states. Each section includes
 * a title, description, and live component demonstrations. Used on the homepage to demonstrate the
 * template's UI building blocks.
 *
 * @returns {JSX.Element} Section element with multiple subsections demonstrating UI components
 *
 * @example
 * <Gallery />
 */
import { useMemo, useState } from 'react';
import { Alert } from '@components/ui/Alert';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Grid } from '@components/ui/Grid';
import { Input } from '@components/ui/Input';
import { Modal } from '@components/ui/Modal';
import { Table } from '@components/ui/Table';
import type { TableColumn } from '@components/ui/Table';
import { Tabs } from '@components/ui/Tabs';
import type { TabItem } from '@components/ui/Tabs';
import type { GallerySection, TeamMemberRow } from './Gallery.types';

export default function Gallery(): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Sample table configuration showcased in the gallery.
   */
  const tableColumns = useMemo<TableColumn<TeamMemberRow>[]>(
    () => [
      { accessor: 'name', label: 'Name' },
      { accessor: 'role', label: 'Role' },
      {
        accessor: 'status',
        label: 'Status',
        render: (value) => (
          <span className="text-success-700 dark:text-success-300 inline-flex items-center gap-1 font-medium">
            <span className="bg-success-500 h-2 w-2 rounded-full" aria-hidden />
            {String(value)}
          </span>
        ),
      },
    ],
    []
  );

  const tableData = useMemo(
    () => [
      { name: 'Avery Rivers', role: 'Designer', status: 'Online' },
      { name: 'Kai Turner', role: 'Developer', status: 'Online' },
      { name: 'Noah Santos', role: 'Product Manager', status: 'Away' },
    ],
    []
  );

  const tabsItems = useMemo<TabItem[]>(
    () => [
      {
        label: 'Overview',
        content: (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tab content for quick summaries.
          </p>
        ),
      },
      {
        label: 'Details',
        content: (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Use tabs to organize dense information.
          </p>
        ),
      },
      {
        label: 'Activity',
        content: (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Tabs support keyboard navigation out of the box.
          </p>
        ),
      },
    ],
    []
  );

  const sections: GallerySection[] = [
    {
      title: 'Buttons',
      description: 'Primary actions in varying styles, sizes, and states.',
      content: (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="danger">Danger</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button isLoading>Loading</Button>
            <Button isDisabled>Disabled</Button>
          </div>
        </div>
      ),
    },
    {
      title: 'Cards',
      description: 'Flexible containers for grouping information and actions.',
      content: (
        <Grid cols={1} mdCols={2} gap={4} className="max-w-4xl">
          <Card title="Default" subtitle="Shadowed card">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Use cards to surface key information.
            </p>
          </Card>
          <Card title="Bordered" subtitle="Outlined variant" variant="bordered">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Bordered cards pair well with dense layouts.
            </p>
          </Card>
          <Card title="Flat" subtitle="Muted styling" variant="flat" isHoverable>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Flat cards blend seamlessly with dashboards.
            </p>
          </Card>
          <Card
            title="Elevated"
            subtitle="High emphasis"
            variant="elevated"
            footer={<Button size="sm">Action</Button>}
          >
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Elevated cards draw attention to priority items.
            </p>
          </Card>
        </Grid>
      ),
    },
    {
      title: 'Alerts',
      description: 'Contextual messaging for feedback and status updates.',
      content: (
        <div className="space-y-3">
          <Alert variant="primary">Primary alert for general information.</Alert>
          <Alert variant="success">Success alert for positive confirmations.</Alert>
          <Alert variant="warning">Warning alert to surface cautionary notes.</Alert>
          <Alert variant="danger">Danger alert for critical messaging.</Alert>
        </div>
      ),
    },
    {
      title: 'Inputs',
      description: 'Form controls with consistent spacing, theming, and validation states.',
      content: (
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Regular input" />
          <Input size="lg" placeholder="Large input" />
          <Input size="sm" placeholder="Small input" />
          <Input isInvalid errorMessage="Required field" placeholder="Invalid state" />
        </div>
      ),
    },
    {
      title: 'Table',
      description: 'Structured data presentation with striping, hover, and compact density.',
      content: (
        <div className="overflow-x-auto">
          <Table
            columns={tableColumns}
            data={tableData}
            striped
            hoverable
            isBordered
            caption="Team roster"
          />
        </div>
      ),
    },
    {
      title: 'Tabs',
      description: 'Switch between related panels while keeping context.',
      content: (
        <div className="max-w-2xl">
          <Tabs items={tabsItems} />
        </div>
      ),
    },
    {
      title: 'Grid Layout',
      description: 'Responsive layout helper for evenly spaced collections.',
      content: (
        <Grid cols={1} smCols={2} mdCols={3} gap={4} className="max-w-3xl">
          {['Analytics', 'Billing', 'Customers', 'Docs', 'Reports', 'Settings'].map((label) => (
            <Card key={label} title={label} variant="flat" isHoverable>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Tailor column counts per breakpoint.
              </p>
            </Card>
          ))}
        </Grid>
      ),
    },
    {
      title: 'Modal',
      description: 'Overlaid dialog for confirmations, forms, or spotlight content.',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Modals close via backdrop, close button, or Escape key.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>Open example modal</Button>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Modal Title"
            footer={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsModalOpen(false)}>Confirm</Button>
              </div>
            }
          >
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Use the modal component to display focused tasks without navigating away.
            </p>
          </Modal>
        </div>
      ),
    },
  ];

  return (
    <section aria-labelledby="component-gallery" className="mt-16">
      <div className="max-w-5xl space-y-4">
        <div>
          <h2 id="component-gallery" className="text-3xl font-bold text-gray-900 dark:text-white">
            Component gallery
          </h2>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-300">
            Explore the ready-to-use UI building blocks included in this template. Each section
            highlights key variants and states so you can copy the patterns into your own features.
          </p>
        </div>
        <div className="space-y-12">
          {sections.map((section) => (
            <article key={section.title} className="space-y-4">
              <header>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>
              </header>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {section.content}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
