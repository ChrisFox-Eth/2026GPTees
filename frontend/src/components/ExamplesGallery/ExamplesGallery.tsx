/**
 * @module components/ExamplesGallery
 * @description Small gallery of example designs to build confidence.
 */

const EXAMPLES = [
  {
    src: 'https://ncgvjcormulfgtxkuvat.supabase.co/storage/v1/object/public/designs/ExampleImages/img-czLKfdUwU1d41urmntC7zjzG.png',
    alt: 'Vintage surf wave tee',
    label: 'A fluffy cat dressed as a pink princess',
  },
  {
    src: 'https://ncgvjcormulfgtxkuvat.supabase.co/storage/v1/object/public/designs/ExampleImages/content%20(5).png',
    alt: 'Clean monogram',
    label: 'An old-timey telephone with a silly pun on the line.',
  },
  {
    src: 'https://ncgvjcormulfgtxkuvat.supabase.co/storage/v1/object/public/designs/ExampleImages/img-xK173YaVJi4uhQxzeQoBNeow.png',
    alt: 'Minimal line art',
    label: 'A majestic dragon with flowing lines',
  },
  {
    src: 'https://ncgvjcormulfgtxkuvat.supabase.co/storage/v1/object/public/designs/ExampleImages/ChatGPT%20Image%20Nov%2026,%202025,%2009_56_03%20AM.png',
    alt: 'Retro badge',
    label: 'A T-Rex playing video games',
  },
  {
    src: 'https://ncgvjcormulfgtxkuvat.supabase.co/storage/v1/object/public/designs/ExampleImages/ChatGPT%20Image%20Nov%2026,%202025,%2009_56_07%20AM.png',
    alt: 'Streetwear graphic',
    label: 'The planet Saturn, but its rings are made of cheese',
  },
  {
    src: 'https://ncgvjcormulfgtxkuvat.supabase.co/storage/v1/object/public/designs/ExampleImages/img-k3tVkSmu5oyBTJhf1WPCQPsm.png',
    alt: 'Bold graphic',
    label: 'A trendy fashionable pop star diva admiring her closet, wardrobe, and shoe collection',
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
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 30vw, 16vw"
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
