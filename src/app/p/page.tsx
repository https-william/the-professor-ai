export const dynamic = 'force-static';
export const revalidate = false;

import ProfileClient from "./ProfileClient";

export default function PublicProfilePage() {
    return <ProfileClient />;
}
