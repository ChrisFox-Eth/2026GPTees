/**
 * @module components/ExamplesGallery
 * @description Small gallery of example designs to build confidence.
 */

const EXAMPLES = [
  {
    src: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
    alt: 'Vintage surf wave tee',
    label: 'Vintage surf',
  },
  {
    src: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80',
    alt: 'Minimal line art',
    label: 'Minimal line art',
  },
  {
    src: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80',
    alt: 'Bold graphic',
    label: 'Bold graphic',
  },
  {
    src: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
    alt: 'Retro badge',
    label: 'Retro badge',
  },
  {
    src: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=400&q=80',
    alt: 'Streetwear graphic',
    label: 'Streetwear',
  },
  {
    src: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80',
    alt: 'Clean monogram',
    label: 'Clean monogram',
  },
];

export default function ExamplesGallery(): JSX.Element {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">See examples</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Real styles you can create.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {EXAMPLES.map((ex) => (
          <div key={ex.alt} className="relative group">
            <img
              src={ex.src}
              alt={ex.alt}
              className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
            />
            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {ex.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
