const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // spaces and underscores → hyphens
    .replace(/[^\w-]/g, '') // remove anything that's not a word char or hyphen
    .replace(/--+/g, '-'); // collapse multiple hyphens

export default slugify;
