export const dynamic = 'force-static';
export const revalidate = false;

import SharedGenerationClient from "./SharedBlogPostClient";

export default function SharedGenerationPage() {
    return <SharedGenerationClient />;
}
