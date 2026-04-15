import prisma from '../config/db.js';

const toDateFromJwtExp = (exp) => new Date(exp * 1000);

export const blacklistToken = async (jti, exp) => {
  if (!jti || !exp) {
    return;
  }

  await prisma.blacklistedToken.upsert({
    where: { jti },
    create: {
      jti,
      expiresAt: toDateFromJwtExp(exp),
    },
    update: {
      expiresAt: toDateFromJwtExp(exp),
    },
  });
};

export const isTokenBlacklisted = async (jti) => {
  if (!jti) {
    return false;
  }

  const record = await prisma.blacklistedToken.findUnique({
    where: { jti },
    select: { expiresAt: true },
  });

  if (!record) {
    return false;
  }

  if (record.expiresAt <= new Date()) {
    await prisma.blacklistedToken.delete({ where: { jti } });
    return false;
  }

  return true;
};
