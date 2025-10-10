import type { PageLoad } from './$types';
import NDK, { NDKEvent, NDKRelaySet } from '@nostr-dev-kit/ndk';
import { indexKind } from '$lib/consts';

/**
 * Fetches featured 30040 (index) events from the medschlr relay
 * @returns Object with publications array
 */
export const load: PageLoad = async () => {
    try {
        // Create a temporary NDK instance for server-side data fetching
        const ndk = new NDK({
            explicitRelayUrls: ['wss://medschlr.nostr1.com'],
            enableOutboxModel: false,
        });

        await ndk.connect();

        // Fetch the 6 most recent 30040 events from medschlr relay
        const events = await ndk.fetchEvents(
            {
                kinds: [indexKind],
                limit: 6,
            },
            {
                groupable: true,
                closeOnEose: true,
            }
        );

        // Convert Set to Array and sort by created_at (newest first)
        const publications = Array.from(events)
            .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
            .slice(0, 6)
            .map((event) => ({
                id: event.id,
                pubkey: event.pubkey,
                kind: event.kind,
                created_at: event.created_at,
                content: event.content,
                tags: event.tags,
                // Extract commonly used tag values
                title: event.getMatchingTags('title')[0]?.[1] || 'Untitled',
                summary: event.getMatchingTags('summary')[0]?.[1] || '',
                dTag: event.getMatchingTags('d')[0]?.[1] || '',
                image: event.getMatchingTags('image')[0]?.[1] || '',
                publishedAt: event.getMatchingTags('published_at')[0]?.[1] || '',
            }));

        console.log(`[Landingpage] Fetched ${publications.length} publications from medschlr relay`);

        return {
            publications,
        };
    } catch (error) {
        console.error('[Landingpage] Error fetching publications:', error);
        // Return empty array on error
        return {
            publications: [],
        };
    }
};
