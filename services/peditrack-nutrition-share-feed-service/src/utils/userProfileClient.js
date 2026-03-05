const DEFAULT_USER_SERVICE_BASE_URL = process.env.USER_SERVICE_BASE_URL

const normalizeBaseUrl = (url) => (url || DEFAULT_USER_SERVICE_BASE_URL).replace(/\/$/, '');

const getUserMeta = (userId, userMap) => {
    const profile = userMap.get(String(userId));
    if (!profile) {
        return null;
    }

    return {
        userId: String(profile._id),
        name: profile.name || null,
        profilePicture: profile.profilePicture || null,
    };
};

const fetchUserProfilesMap = async (userIds = []) => {
    const cleaned = [...new Set((userIds || []).map((id) => String(id).trim()).filter(Boolean))];
    if (cleaned.length === 0) {
        return new Map();
    }

    const baseUrl = normalizeBaseUrl(process.env.USER_SERVICE_BASE_URL);

    try {
        const response = await fetch(`${baseUrl}/users/public/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userIds: cleaned }),
        });

        if (!response.ok) {
            throw new Error(`User service responded with ${response.status}`);
        }

        const data = await response.json();
        const users = Array.isArray(data?.users) ? data.users : [];

        const userMap = new Map();
        users.forEach((user) => {
            if (user && user._id) {
                userMap.set(String(user._id), user);
            }
        });

        return userMap;
    } catch (error) {
        console.error('[userProfileClient] Failed to fetch public user profiles:', error.message || error);
        return new Map();
    }
};

module.exports = {
    fetchUserProfilesMap,
    getUserMeta,
};
