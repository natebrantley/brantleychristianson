/**
 * Optional short copy for key markets: "Why [Area]" or "What to know."
 * Keyed by state slug, county slug, or city slug (e.g. "portland", "multnomah", "vancouver").
 * Used to expand About sections on city and county pages.
 */

export const marketWhatToKnow: Record<string, string> = {
  multnomah:
    'From downtown condos to Eastside neighborhoods and the Columbia corridor, Multnomah County offers a wide range of urban and suburban options. We help buyers and sellers navigate Portland, Gresham, and surrounding communities.',
  clark:
    'Clark County spans Vancouver, Camas, Battle Ground, and Washougal—no state income tax on the Washington side, with easy access to Portland. Our brokers know both sides of the river.',
  clackamas:
    'Lake Oswego, West Linn, Oregon City, and Happy Valley anchor this diverse county. You get suburban and semi-rural options plus the Mt. Hood gateway—we help you find the right fit.',
  washington:
    'Washington County is the Silicon Forest: Beaverton, Hillsboro, Tigard, and Tualatin. Strong schools and tech employers make it a top choice for families and commuters.',
  cowlitz:
    'Longview, Kelso, Castle Rock, and Kalama sit along the Lower Columbia. We serve buyers and sellers who want river access, smaller-town pace, and I-5 convenience.',
  portland:
    'Portland’s neighborhoods each have their own character—from the Pearl and inner SE to St. Johns and the west hills. Whether you’re looking at condos, single-family, or new construction, we bring local expertise and data to the conversation.',
  vancouver:
    'Vancouver is the largest city in Southwest Washington and part of the Portland-Vancouver metro. No state income tax, strong schools, and a growing downtown make it a popular choice for buyers from both sides of the river.',
  camas:
    'Camas has evolved from a paper-mill town into one of the most sought-after communities in Clark County. Great schools, a walkable downtown, and quick access to Portland and the Gorge.',
  'lake-oswego':
    'Lake Oswego offers lakefront living, top-rated schools, and a tight-knit community feel. We help buyers and sellers navigate a competitive market with clarity and strategy.',
  beaverton:
    'Beaverton is the heart of the Silicon Forest, with light rail, diverse neighborhoods, and strong demand from tech workers and families. We know the submarkets and the inventory.',
};

/** Get "what to know" blurb for a county or city by slug; returns undefined if none. */
export function getWhatToKnow(slug: string): string | undefined {
  return marketWhatToKnow[slug.toLowerCase()];
}
