import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
	{ name: 'Health' },
	{ name: 'Emergency' },
	{ name: 'Business' },
	{ name: 'Charity' },
	{ name: 'Education' },
    { name: 'Medical' },
    { name: 'Environment' },
    { name: 'Community' },
    { name: 'Technology' },
];

async function main() {
	await prisma.category.createMany({
		data: defaultCategories,
		skipDuplicates: true,
	});

	console.log('Default categories seeded successfully.');
}

main()
	.catch((error) => {
		console.error('Seeding failed:', error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
