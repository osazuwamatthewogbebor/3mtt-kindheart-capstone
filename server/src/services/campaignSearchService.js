import prisma from "../config/db.js"

export const searchCampaigns = async (filters) => {
    const { query, category, owner, page, limit } = filters;
    const skip = (page - 1) * limit;

    // Building the where object
    let whereClause = { AND: [] };

    if (query) {
        whereClause.AND.push({
            OR: [
                { title: { contains: query, mode: "insensitive"} },
                { description: { contains: query, mode: "insensitive" } },
            ]
        });
    }


    if (category) {
        whereClause.AND.push({
            category: {
                name: { contains: category, mode: "insensitive"}
            }
        });
    }

    if (owner) {
        whereClause.AND.push({
            user: {
                name: {contains: owner, mode: "insensitive"}
            }
        });
    }

    const [total, campaigns] = await Promise.all([
        prisma.campaign.count({ where: whereClause }),
        prisma.campaign.findMany({
            where: whereClause,
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