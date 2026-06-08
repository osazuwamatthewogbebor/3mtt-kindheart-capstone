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

	// Find an existing user to own seeded campaigns (prefer admin email)
	const owner = await prisma.user.findFirst({ where: { email: 'admin@kindheart.org' } })
		|| await prisma.user.findFirst();

	if (!owner) {
		console.warn('No users found - skipping campaign seeding. Create a user first.');
		return;
	}

	const categories = await prisma.category.findMany();
	const catByName = Object.fromEntries(categories.map(c => [c.name, c.id]));

	const now = new Date();
	const days = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

	// Seed campaigns (idempotent using upsert on title)
	const campaignsToSeed = [
		{
			title: 'Clean Water',
			description: 'Providing clean drinking water to remote communities.',
			categoryName: 'Health',
			goalAmount: '150000.00',
			endDate: days(45),
			imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1000&q=80',
			campaignStatus: 'APPROVED',
		},
		{
			title: 'School Supplies for Children',
			description: 'Help equip children with books and stationery for the new term.',
			categoryName: 'Education',
			goalAmount: '80000.00',
			endDate: days(30),
			imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=80',
			campaignStatus: 'APPROVED',
		},
		{
			title: 'Medical Aid for Sarah',
			description: 'Urgent funds required for Sarah\'s surgery and recovery.',
			categoryName: 'Medical',
			goalAmount: '500000.00',
			endDate: days(10),
			imageUrl: 'https://images.unsplash.com/photo-1584453964085-3a6f8f3a0f4f?auto=format&fit=crop&w=1000&q=80',
			campaignStatus: 'PENDING',
		},
		{
			title: 'Community Garden Project',
			description: 'Create a sustainable community garden for local families.',
			categoryName: 'Community',
			goalAmount: '60000.00',
			endDate: days(60),
			imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80',
			campaignStatus: 'APPROVED',
		},
	];

	for (const c of campaignsToSeed) {
		const categoryId = catByName[c.categoryName] || categories[0]?.id;
		if (!categoryId) continue;

		// Generate a simple imagePublicId used by Cloudinary in production
		const safeTitle = c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
		const imagePublicId = `seed-${safeTitle}`;

		const existing = await prisma.campaign.findUnique({ where: { title: c.title } });
		if (existing) {
			await prisma.campaign.update({
				where: { id: existing.id },
				data: {
					description: c.description,
					categoryId,
					goalAmount: c.goalAmount,
					endDate: c.endDate,
					imageUrl: c.imageUrl,
					imagePublicId,
					campaignStatus: c.campaignStatus,
					userId: owner.id,
				},
			});
			console.log(`Updated campaign: ${c.title}`);
		} else {
			await prisma.campaign.create({
				data: {
					userId: owner.id,
					title: c.title,
					description: c.description,
					categoryId,
					goalAmount: c.goalAmount,
					endDate: c.endDate,
					imageUrl: c.imageUrl,
					imagePublicId,
					campaignStatus: c.campaignStatus,
				},
			});
			console.log(`Created campaign: ${c.title}`);
		}
	}

	console.log('Campaigns seeded successfully.');
}

main()
	.catch((error) => {
		console.error('Seeding failed:', error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
