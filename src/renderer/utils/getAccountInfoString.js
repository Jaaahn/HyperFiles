export default function getAccountInfoString(profile) {
    return `${profile.remote.username}@${profile.remote.host}:${profile.remote.port}`;
}
