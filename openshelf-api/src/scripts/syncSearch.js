require('dotenv').config();

const prisma = require('../config/prisma');
const { bulkIndex } = require('../services/search.service');
const { configureIndex } = require('../config/meilisearch');

async function main() {
    console.log('Configuring Meilisearch index...');
    await configureIndex();

    console.log('Fetching resources from database...');
    const resources = await prisma.resource.findMany({
        where: { isPublished: true },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            tags: { include: { tag: true } },
        },
    })

    console.log(`Indexing ${resources.length} resources...`);
    await bulkIndex(resources);

    console.log('Sync completed!');
    await prisma.$disconnect();
}

main().catch((err) => {
    console.error('Error during sync:', err);
    process.exit(1);
});