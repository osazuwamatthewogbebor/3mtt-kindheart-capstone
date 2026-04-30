import prisma from "../config/db.js"

export const searchCampaigns = async (searchQuery, page, limit) => {
    const skip = (page - 1) * limit;

    const [total, campaigns] = await Promise.all([
        prisma.campaign.count({
            where: {
                OR: [
                    {title: { contains: searchQuery, mode: "insensitive"}},
                    {description: {contains: searchQuery, mode: "insensitive"}}
                ]
            }
        }),
        prisma.campaign.findMany({
            where: {
                OR: [
                    { title: { contains: searchQuery, mode: "insensitive" } },
                    { description: { contains: searchQuery, mode: "insensitive" } }
                ]
            },
            skip,
            take: limit,
            include: {
                category: { select: { name: true }},
                user: { select: { name: true }}
            },
            orderBy: { createdAt: "desc" }
        }),
    ])

    return {
        campaigns, 
        pagination: {
            totalItems: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            limit
        }
    }
}