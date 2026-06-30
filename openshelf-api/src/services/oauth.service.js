const prisma = require('../config/prisma');

class OAuthAccountConflictError extends Error {
    constructor(email) {
        super(`An account with ${email} already exists. Please log in with your password instead.`);
        this.status = 409;
        this.code = 'OAUTH_ACCOUNT_CONFLICT';
    }
}

const findOrCreateUser = async ({ provider, providerId, email, name, avatarUrl }) => {
    if (!email) {
        const err = new Error(`${provider} did not provide an email address. 
            Please make sure your email is public/verified on your account, or sign up with a password instead.`);

        err.status = 400;
        throw err;
    }


    const existingOAuthUser = await prisma.user.findFirst({
        where: {
            oauthProvider: provider,
            oauthId: providerId
        }
    })

    if (existingOAuthUser) {
        if (!existingOAuthUser.isActive) {
            const err = new Error(`Your account has been deactivated. Please contact support for assistance.`);
            err.status = 403;
            throw err;
        }
        return existingOAuthUser;
    }

    const existingEmailUser = await prisma.user.findUnique({ where: { email } });
    if (existingEmailUser) {
        if (existingEmailUser.passwordHash) {
            throw new OAuthAccountConflictError(email);
        }
        throw new OAuthAccountConflictError(email);
    }

    const pendingInvite = await prisma.staffInvite.findFirst({
        where: { email, usedAt: null, expiresAt: { gt: new Date() } },
    })
    if (pendingInvite) {
        const err = new Error(
            'This email has a pending staff invite. Please check your inbox and use the invite link to set up your account.'
        )
        err.status = 403
        throw err
    }

    const user = await prisma.user.create({
        data: {
            name: name || email.split('@')[0],
            email,
            oauthProvider: provider,
            oauthId: providerId,
            avatarUrl: avatarUrl || null,
            isEmailVerified: true, // provider has already verified the email
        },
    })

    return user
}

module.exports = { findOrCreateUser, OAuthAccountConflictError }