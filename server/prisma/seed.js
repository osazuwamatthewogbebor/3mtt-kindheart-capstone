import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
	{ name: 'Health' },
	{ name: 'Education' },
	{ name: 'Emergency' },
	{ name: 'Business' },
	{ name: 'Charity' },
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
