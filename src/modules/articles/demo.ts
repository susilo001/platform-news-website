import type { RichNode } from "./content";
export const categories = [
  {
    id: "world",
    name: "World",
    slug: "world",
    description: "A wider lens on a changing world.",
  },
  {
    id: "politics",
    name: "Politics",
    slug: "politics",
    description: "The decisions shaping our shared future.",
  },
  {
    id: "technology",
    name: "Technology",
    slug: "technology",
    description: "Ideas and inventions changing how we live.",
  },
  {
    id: "business",
    name: "Business",
    slug: "business",
    description: "The people and forces moving the economy.",
  },
  {
    id: "culture",
    name: "Culture",
    slug: "culture",
    description: "Art, identity, and the way we live now.",
  },
  {
    id: "science",
    name: "Science",
    slug: "science",
    description: "Discoveries that expand what is possible.",
  },
];
const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=85`;
const people = [
  {
    id: "maya",
    name: "Maya Santoso",
    slug: "maya-santoso",
    bio: "Maya writes about cities, climate, and the people finding new ways forward.",
  },
  {
    id: "james",
    name: "James Whitfield",
    slug: "james-whitfield",
    bio: "James covers technology and the relationship between innovation and everyday life.",
  },
  {
    id: "amara",
    name: "Amara Okafor",
    slug: "amara-okafor",
    bio: "Amara reports on culture, communities, and the ideas connecting us.",
  },
];
export type Story = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: { id: string; name: string; slug: string };
  authors: typeof people;
  image: string;
  alt: string;
  publishedAt: string;
  updatedAt: string;
  body: RichNode;
  tags: string[];
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
};
const source = [
  [
    "the-cities-rewriting-the-rules-of-urban-living",
    "The cities rewriting the rules of urban living",
    "From greener streets to spaces that bring people together, a new generation of urban thinkers is asking a simple question: what makes a city worth living in?",
    "world",
    "photo-1519501025264-65ba15a82390",
    "A city skyline and dense urban streets in warm evening light",
    0,
  ],
  [
    "the-human-side-of-artificial-intelligence",
    "The human side of artificial intelligence",
    "Beyond the headlines and the hype, communities are exploring what useful, responsible technology could look like.",
    "technology",
    "photo-1485827404703-89b55fcc595e",
    "An experimental humanoid robot on display",
    1,
  ],
  [
    "a-quieter-kind-of-economic-revolution",
    "A quieter kind of economic revolution",
    "Meet the independent businesses putting people and their neighbourhoods at the centre of growth.",
    "business",
    "photo-1441986300917-64674bd600d8",
    "A sunlit independent shop with carefully arranged clothing",
    0,
  ],
  [
    "where-the-next-chapter-begins",
    "Where the next chapter begins",
    "Inside the independent bookshops creating a new sense of community, one conversation at a time.",
    "culture",
    "photo-1507842217343-583bb7270b66",
    "Warmly lit shelves in a library full of books",
    2,
  ],
  [
    "a-new-perspective-on-our-blue-planet",
    "A new perspective on our blue planet",
    "The ocean holds questions we are only beginning to ask. A closer look at the people listening for answers.",
    "science",
    "photo-1518837695005-2083093ee35b",
    "Ocean waves rolling toward the coast",
    0,
  ],
  [
    "the-return-of-the-night-train",
    "The return of the night train",
    "Slow journeys, unexpected encounters, and a different way of seeing the places between destinations.",
    "world",
    "photo-1474487548417-781cb71495f3",
    "A passenger train travelling through a green landscape",
    2,
  ],
  [
    "rethinking-the-public-square",
    "Rethinking the public square",
    "How shared spaces can help people disagree constructively and build something together.",
    "politics",
    "photo-1449824913935-59a10b8d2000",
    "A broad city street framed by buildings",
    0,
  ],
  [
    "inside-the-new-creative-workshop",
    "Inside the new creative workshop",
    "A generation of makers is finding fresh possibilities in traditional materials and techniques.",
    "culture",
    "photo-1455390582262-044cdead277a7",
    "A notebook and writing tools on a creative workspace",
    2,
  ],
  [
    "the-energy-transition-close-to-home",
    "The energy transition, close to home",
    "What happens when neighbourhoods take a hands-on approach to the energy they use every day.",
    "science",
    "photo-1508514177221-188b1cf16e9d",
    "Solar panels collecting energy under a blue sky",
    1,
  ],
  [
    "designing-a-more-thoughtful-internet",
    "Designing a more thoughtful internet",
    "The designers looking beyond engagement metrics to build digital spaces that respect our attention.",
    "technology",
    "photo-1498050108023-c5249f4df085",
    "A laptop on a desk in a bright workspace",
    1,
  ],
  [
    "small-business-big-ideas",
    "Small business. Big ideas.",
    "Local entrepreneurs are showing how a fresh perspective can change a familiar high street.",
    "business",
    "photo-1442512595331-e89e73853f31",
    "A barista preparing coffee in a neighbourhood cafe",
    0,
  ],
  [
    "the-art-of-looking-a-little-closer",
    "The art of looking a little closer",
    "Why taking our time with art can change how we see the world outside the gallery.",
    "culture",
    "photo-1577083552431-6e5fd01aa342",
    "Visitors exploring a gallery of art",
    2,
  ],
] as const;
export const demoStories: Story[] = source.map((s, i) => ({
  id: `sample-${i + 1}`,
  slug: s[0],
  title: s[1],
  summary: s[2],
  category: categories.find((c) => c.id === s[3])!,
  authors: [people[s[6]]],
  image: photo(s[4]),
  alt: s[5],
  publishedAt: new Date(Date.UTC(2026, 10, 10, 6 - i)).toISOString(),
  updatedAt: new Date(Date.UTC(2026, 10, 10, 6 - i)).toISOString(),
  tags: [s[3], "Perspectives"],
  featured: i === 0,
  seoTitle: s[1],
  seoDescription: s[2],
  body: {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: s[2] }] },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "The most interesting changes often start with a different question. Across communities, people are taking a closer look at familiar challenges, making space for new perspectives and practical experiments.",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "A different way forward" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "There is no single blueprint. What connects these ideas is a willingness to listen, learn, and consider the people who will live with the results. Progress is measured in small decisions as much as ambitious plans.",
          },
        ],
      },
      {
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A better future begins with paying attention to the world around us.",
              },
            ],
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "The questions remain open, and that is part of the story. The next chapter will be written by the communities, researchers, makers, and readers who choose to take part.",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "This is illustrative sample content for The Current website demonstration, not a reported news article.",
          },
        ],
      },
    ],
  },
}));
